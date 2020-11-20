class NetworkPlot {
  constructor(root, width, height, nodes, links, updateFun) {
    this.width = width;
    this.height = height;
    this.root = d3
      .select(root)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.minLinks = 10;
    // this.nodes = this.removeUnconnectedNodes(nodes, links);
    this.nodes = nodes;
    this.nodes = this.removeUnconnectedNodes(nodes, links);
    this.links = links;
    this.shiftX = 225;
    this.shiftY = -30;
    this.circles;
    this.paths;
    this.activeSubreddit;

    this.updateFun = updateFun;

    this.setupPlot();
  }
  
  setupPlot() {
    this.root
      .attr("viewBox", [
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
      ])

    this.addTitle();
  }

  addTitle() {
    this.root
      .append("text")
      .classed("title", true)
      .attr("x", 0)
      .attr("y", -this.height / 2 + 30)
      .style("font-size", 22)
      .attr("text-decoration", "underline")
      .text("The Gaming Landscape");
  }

  setUpdateFun(updateFun) {
    this.updateFun = updateFun;
  }

  /**  Note: The following tutorial is heavily used:
  https://observablehq.com/@d3/mobile-patent-suits?collection=@d3/d3-force
  */
  draw() {
    if (this.updateFun === undefined) {
      throw "`updateFun` must be set before drawing NetworkPlot";
    }
    // let links = this.links;
    // let nodes = this.removeUnconnectedNodes(this.nodes, links);

    let simulation = d3
      .forceSimulation(this.nodes)
      .force(
        "link",
        d3.forceLink(this.links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("x", d3.forceX().strength(0.01))
      .force("y", d3.forceY().strength(0.1));

    // http://thenewcode.com/1068/Making-Arrows-in-SVG
    this.root
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("markerUnits", "userSpaceOnUse")
      .attr("markerHeight", 100)
      .attr("markerWidth", 100)
      .attr("refX", 22)
      .attr("refY", 3.25)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 15 5.25, 0 10.5")
      .style("fill", "#336EFF")
      .attr("stroke", "black");


    // add arrow marker
    // this.root
    //   .append("defs")
    //   .append("marker")
    //   .attr("id", "arrow")
    //   .attr("viewBox", "0 -5 10 10")
    //   .attr("refX", 15)
    //   .attr("refY", -0.5)
    //   .attr("markerWidth", 6)
    //   .attr("markerHeight", 6)
    //   .attr("orient", "auto")
    //   .attr("markerUnits", "userSpaceOnUse")
    //   .append("path")
    //   .attr("fill", "black")
    //   .attr("d", "M0,-5L10,0L0,5");

    // http://thenewcode.com/1068/Making-Arrows-in-SVG
    let radiusScale = this.makeRadiusSale();

    let widthScale = this.makeStrokeWidthScale(this.links);

    this.paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(this.links)
      .join("path")
      .attr("stroke", this.getColor)
      .attr("stroke-width", (d) => widthScale(d.mentions))
      .style("opacity", 0.1)
      .attr("marker-end", "url(#arrow)");

    this.circles = this.root
      .append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(this.nodes)
      .join("g");
    // .style("opacity", 0.8);

    this.circles.on("mouseenter", (event) => this.highlightRegion(event, this));
    this.circles.on("click", (event) => {
      this.activeSubreddit = event.id;
      this.clearCircleHighlights();
      this.updateFun(event.id);
    });

    this.circles
      .append("circle")
      .attr("fill", this.getNodeColor)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("r", (d) => radiusScale(d.interactions));

    this.circles
      .append("text")
      .attr("fill", "black")
      .attr("x", 5)
      .attr("y", -14)
      .style("font-size", "10")
      .raise()
      .text((d) => d.id)
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    // simulation.on("tick", () => {
    //   this.paths.attr("d", this.linkArc);
    //   this.circles.attr("transform", (d) => `translate(${d.x},${d.y})`);
    // });
    simulation.tick(300);
    this.paths.attr("d", (d) => this.linkArc(d, this.shiftX, this.shiftY));
    this.circles.attr(
      "transform",
      (d) => `translate(${d.x + this.shiftX},${d.y + this.shiftY})`
    );

    // this.root.on("mouseover", this.clearHighlights());
    this.root.on("mouseover", (e) => this.clearHighlights());
  }

  removeUnconnectedNodes(nodes, links) {
    let outNodes = links.map((d) => d.target);
    let inNodes = links.map((d) => d.source);
    let connectedNodes = outNodes.concat(inNodes);
    return nodes.filter((node) =>
      connectedNodes.some((connectedNode) => connectedNode == node.id)
    );
  }

  linkArc(link, shiftX) {
    const r = Math.hypot(
      link.target.x - link.source.x,
      link.target.y - link.source.y
    );
    return `
    M${link.source.x + this.shiftX},${link.source.y + this.shiftY}
    A${r},${r} 0 0,1 ${link.target.x + this.shiftX},${
      link.target.y + this.shiftY
    }
  `;
  }

  makeRadiusSale() {
    let min = d3.min(this.nodes, (node) => node.interactions);
    let max = d3.max(this.nodes, (node) => node.interactions);
    return d3.scaleLinear().domain([min, max]).range([6, 12]);
  }

  /** Apply diverging color scale to link sentiment values */
  getColor = function (link) {
    return d3.interpolateRdBu(1 - link.sentiment);
  };

  getNodeColor = function (node) {
    return d3.interpolateRdBu(1 - node.positivity);
  };

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([2, 8]);
  }

  highlightRegion(event, view) {
    this.clearHighlights();
    this.circles
      .selectAll("circle")
      .filter((circle) => circle.id !== this.activeSubreddit)
      .style("opacity", 0.6);

    let selectedNode = event.id;
    this.paths
      .filter((d) => d.target.id == selectedNode || d.source.id == selectedNode)
      .style("opacity", 1);

    this.circles
      .filter((d) => d.id == selectedNode)
      .selectAll("circle")
      .style("opacity", 100)
      .attr("stroke", "#FFBE33")
      .attr("stroke-width", 3);
  }

  clearHighlights() {
    this.paths.style("opacity", 0.1);
    this.clearCircleHighlights();
  }

  clearCircleHighlights() {
    this.circles
      .selectAll("circle")
      .filter((circle) => circle.id !== this.activeSubreddit)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .style("opacity", 1);
  }
}
