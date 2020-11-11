class NodePlot {
  constructor(data, activeSubreddit, mode) {
    this.width = 1200;
    this.height = 1200;
    this.root = d3
      .select("#node-view-container")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.subreddits = Object.keys(data);
    this.data = this.unnestData(data).filter((d) =>
      this.subreddits.includes(d.TARGET_SUBREDDIT)
    );
    this.nodes = this.createNodeData();
    this.links = this.createLinkData();

    this.drawPlot("nintendo");
  }

  /**  Note: The following tutorial is heavily used:
  https://observablehq.com/@d3/mobile-patent-suits?collection=@d3/d3-force
  */
  drawPlot(selected) {
    let links = [...this.links];
    if (selected !== null) {
      links = this.filterLinks(links, selected);
    }
    let nodes = this.removeUnconnectedNodes(this.nodes, links);

    let simulation = d3
      .forceSimulation(this.nodes)
      .force(
        "link",
        d3.forceLink(this.links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    this.root
      .attr("viewBox", [
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
      ])
      .style("font", "12px sans-serif");

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

    let paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", this.getColor)
      .attr("stroke-width", (d) => widthScale(d.mentions))
      .attr("marker-end", "url(#arrow)");

    let circles = this.root
      .append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(nodes)
      .join("g");

    circles
      .append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("r", 3);

    circles
      .append("text")
      .attr("x", 8)
      .attr("y", -15)
      .text((d) => d.id)
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    simulation.on("tick", () => {
      paths.attr("d", this.linkArc);
      circles.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
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

  linkArc(link) {
    const r = Math.hypot(
      link.target.x - link.source.x,
      link.target.y - link.source.y
    );
    return `
    M${link.source.x},${link.source.y}
    A${r},${r} 0 0,1 ${link.target.x},${link.target.y}
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
    return d3.scaleLinear().domain([minimum, maximum]).range([1.5, 3.5]);
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

    return links.filter((link) => link.mentions > 20);
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
}
