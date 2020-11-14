class NodePlot {
  constructor(data, root, activeSubreddit, width, height) {
    this.width = width;
    this.height = height;
    this.root = d3
      .select(root)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    
    // this.root.on("mouseover", this.clearHighlights());
    // this.root.on("mouseclick", alert("hi"));

    this.activeSubreddit = activeSubreddit;
    this.subreddits = Object.keys(data);
    this.data = this.unnestData(data).filter((d) =>
      this.subreddits.includes(d.TARGET_SUBREDDIT)
    );
    this.minLinks = 10;
    this.nodes = this.createNodeData();
    this.links = this.createLinkData();
    this.shiftX = 0;
    this.circles;
    this.paths;
  }

  /**  Note: The following tutorial is heavily used:
  https://observablehq.com/@d3/mobile-patent-suits?collection=@d3/d3-force
  */
  drawPlot() {
    let links = [...this.links];
    if (this.activeSubreddit !== null) {
      links = this.filterLinks(links, this.activeSubreddit);
    }
    let nodes = this.removeUnconnectedNodes(this.nodes, links);

    let simulation = d3
      .forceSimulation(this.nodes)
      .force(
        "link",
        d3.forceLink(this.links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-600))
      .force("x", d3.forceX().strength(0.06))
      .force("y", d3.forceY().strength(0.2));

    this.root
      .attr("viewBox", [
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
      ])
      .style("font", "8px sans-serif");

    // add arrow marker
    this.root
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "black")
      .attr("d", "M0,-5L10,0L0,5");

    let widthScale = this.makeStrokeWidthScale(links);

    this.paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", this.getColor)
      .attr("stroke-width", (d) => widthScale(d.mentions))
      .style("opacity", 0.1)
    // .attr("stroke-width", 1.5)
    .attr("marker-end", "url(#arrow)");

    this.circles = this.root
      .append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("opacity", 0.75);

    this.circles.on("mouseenter", (event) => this.highlightRegion(event, this));

    this.circles
      .append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("r", 8);

    this.circles
      .append("text")
      .attr("x", 5)
      .attr("y", -12)
      .style("font-size", "9")
      .raise()
      .text((d) => d.id)
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    simulation.on("tick", () => {
      this.paths.attr("d", (d) => this.linkArc(d, this.shiftX));
      this.circles.attr(
        "transform",
        (d) => `translate(${d.x + this.shiftX},${d.y})`
      );
    });

    this.root.on("mouseenter", this.clearHighlights());
  }

  filterLinks(links, selected) {
    let outLinks = links.filter((link) => link.source == selected);
    let inLinks = links.filter((link) => link.target == selected);
    return outLinks.concat(inLinks);
  }

  removeUnconnectedNodes(nodes, links) {
    let outNodes = links.map((d) => d.target);
    let inNodes = links.map((d) => d.source);
    let connectedNodes = outNodes.concat(inNodes);
    return this.nodes.filter((node) =>
      connectedNodes.some((connectedNode) => connectedNode == node.id)
    );
  }

  linkArc(link, shiftX) {
    const r = Math.hypot(
      link.target.x - link.source.x,
      link.target.y - link.source.y
    );
    return `
    M${link.source.x + shiftX},${link.source.y}
    A${r},${r} 0 0,1 ${link.target.x + shiftX},${link.target.y}
  `;
  }

  /** Apply diverging color scale to link sentiment values */
  getColor = function (link) {
    return d3.interpolateRdBu(link.sentiment);
  };

  /** Create a list of node objects */
  createNodeData() {
    return this.subreddits.map((subreddit) => ({
      id: subreddit,
      label: subreddit,
    }));
  }

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([1.5, 5]);
  }

  /** Create a list of link objects */
  createLinkData() {
    let rolledSummaries = d3
      .nest()
      .key((d) => d.SOURCE_SUBREDDIT)
      .key((d) => d.TARGET_SUBREDDIT)
      .rollup((v) => ({
        sentiment: d3.mean(v, (d) => d.LINK_SENTIMENT),
        mentions: v.length,
      }))
      .object(this.data);

    let links = [];
    for (let source of Object.keys(rolledSummaries)) {
      for (let target of Object.keys(rolledSummaries[source])) {
        let vals = rolledSummaries[source][target];
        vals.id = source + "-" + target;
        vals.source = source;
        vals.target = target;
        links.push(vals);
      }
    }

    return links.filter((link) => link.mentions >= this.minLinks);
  }

  unnestData = function (data) {
    let unnestedData = [];
    for (let [target, sourcePosts] of Object.entries(data)) {
      for (let key in sourcePosts) {
        let post = Object.assign({}, sourcePosts[key]);
        post.SOURCE_SUBREDDIT = target;
        unnestedData.push(post);
      }
    }
    return unnestedData;
  };

  highlightRegion(event, view) {
    // let outLinks = links.filter((link) => link.source == selected);
    // let inLinks = links.filter((link) => link.target == selected);
    // return outLinks.concat(inLinks);
    // console.log(this.paths);
    // console.log(this.links);
    // this.paths.filter(l =)
    // console.log(this.paths);
    this.clearHighlights();
    let selectedNode = event.id;
    this.paths
      .filter((d) => d.target.id == selectedNode || d.source.id == selectedNode) .style("opacity", 100);
    
    this.circles.filter(d => d.id == selectedNode).style("opacity", 1);
  }
  
  clearHighlights() {
    this.paths.style("opacity", 0.1);
    this.circles.style("opacity", 0.8);
  }
}
