class NodePlot {
  constructor(root, width, height, nodes, links) {
    this.width = width;
    this.height = height;
    this.root = d3
      .select(root)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.minLinks = 10;
    this.nodes = JSON.parse(JSON.stringify(nodes));
    this.links = JSON.parse(JSON.stringify(links));
    this.shiftX = 0;
    this.circles;
    this.paths;

    this.isDrawn = false;
  }

  /**  Note: The following tutorial is heavily used:
  https://observablehq.com/@d3/mobile-patent-suits?collection=@d3/d3-force
  */
  draw(activeSubreddit) {
    if (this.isDrawn) {
      this.clearPlot();
    }

    let links = this.filterLinks(activeSubreddit);
    let nodes = this.removeUnconnectedNodes(links);

    let simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-3000))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .stop();

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
    this.paths.attr("d", (d) => this.linkArc(d, this.shiftX));
    this.circles.attr(
      "transform",
      (d) => `translate(${d.x + this.shiftX},${d.y})`
    );

    // simulation.on("tick", () => {
    //   this.paths.attr("d", (d) => this.linkArc(d, this.shiftX));
    //   this.circles.attr(
    //     "transform",
    //     (d) => `translate(${d.x + this.shiftX},${d.y})`
    //   );
    // });
    
    // center everything
    let selectedX = nodes.filter(node => node.id == activeSubreddit)[0].x;
    let selectedY = nodes.filter(node => node.id == activeSubreddit)[0].y;
    console.log(selectedX);
    console.log(this.width / 2);
    let shiftX = 0;
    let shiftY = 10;

    simulation.tick(300);
    this.paths.attr("d", (d) => this.linkArc(d, shiftX, shiftY));
    this.circles.attr(
      "transform",
      (d) => `translate(${d.x + shiftX},${d.y + shiftY})`
    );

    this.isDrawn = true;
  }

  removeUnconnectedNodes(links) {
    let nodes = JSON.parse(JSON.stringify(this.nodes));
    console.log("start");
    let outNodes = links.map((d) => d.target);
    let inNodes = links.map((d) => d.source);
    let connectedNodes = outNodes.concat(inNodes);
    let filtered = nodes.filter((node) =>
      connectedNodes.some((connectedNode) => connectedNode == node.id)
    );

    return nodes.filter((node) =>
      connectedNodes.some((connectedNode) => connectedNode == node.id)
    );
  }

  linkArc(link, shiftX, shiftY) {
    const r = Math.hypot(
      link.target.x - link.source.x,
      link.target.y - link.source.y
    );
    return `
    M${link.source.x + shiftX},${link.source.y + shiftY}
    A${r},${r} 0 0,1 ${link.target.x + shiftX},${link.target.y + shiftY}
  `;
  }

  /** Apply diverging color scale to link sentiment values */
  getColor = function (link) {
    return d3.interpolateRdBu(link.sentiment);
  };

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([1.5, 5]);
  }

  filterLinks(selected) {
    let links = JSON.parse(JSON.stringify(this.links));

    let outLinks = links.filter((link) => link.source == selected);
    let inLinks = links.filter((link) => link.target == selected);
    return outLinks.concat(inLinks);
  }

  clearPlot() {
    this.circles.remove();
    this.paths.remove();
    this.isDrawn = false;
  }
}
