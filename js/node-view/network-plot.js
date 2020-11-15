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
    this.links = links;
    this.shiftX = 0;
    this.circles;
    this.paths;

    this.updateFun = updateFun;
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

    let radiusScale = this.makeRadiusSale();

    this.circles = this.root
      .append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(this.nodes)
      .join("g")
      .style("opacity", 0.75)

    this.circles.on("mouseenter", (event) => this.highlightRegion(event, this));
    this.circles.on("click", (event) => this.updateFun(event.id));

    this.circles
      .append("circle")
      .attr("fill", this.getNodeColor)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("r", (d) => radiusScale(d.interactions));

    this.circles
      .append("text")
      .attr("fill", "black")
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
    M${link.source.x + shiftX},${link.source.y}
    A${r},${r} 0 0,1 ${link.target.x + shiftX},${link.target.y}
  `;
  }

  makeRadiusSale() {
    let min = d3.min(this.nodes, (node) => node.interactions);
    let max = d3.max(this.nodes, (node) => node.interactions);
    return d3.scaleLinear().domain([min, max]).range([6, 12]);
  }

  /** Apply diverging color scale to link sentiment values */
  getColor = function (link) {
    return d3.interpolateRdBu(link.sentiment);
  };

  getNodeColor = function (node) {
    return d3.interpolateRdBu(node.positivity);
  };

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([1.5, 5]);
  }

  highlightRegion(event, view) {
    this.clearHighlights();
    let selectedNode = event.id;
    this.paths
      .filter((d) => d.target.id == selectedNode || d.source.id == selectedNode)
      .style("opacity", 100);

    this.circles.filter((d) => d.id == selectedNode).style("opacity", 1).selectAll("circle").attr("stroke", "yellow")
  }

  clearHighlights() {
    this.paths.style("opacity", 0.1);
    this.circles.style("opacity", 0.8).selectAll("circle").attr("stroke", "black")
  }
}
