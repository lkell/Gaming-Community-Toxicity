class NodePlot {
  constructor(root, width, height, nodes, links) {
    this.width = width;
    this.height = height;
    this.root = d3
      .select(root)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "node-view-tooltip")
      .classed("tooltip", true);

    this.radius = 180;

    this.minLinks = 10;
    this.nodes = JSON.parse(JSON.stringify(nodes));
    this.links = JSON.parse(JSON.stringify(links));
    this.shiftX = 0;
    this.circles;
    this.paths;
    this.widthScale = this.makeStrokeWidthScale(this.links);

    this.isDrawn = false;
  }

  /**  Note: The following tutorial is heavily used:
  https://observablehq.com/@d3/mobile-patent-suits?collection=@d3/d3-force
  */
  draw(activeSubreddit) {
    if (this.isDrawn) {
      this.clearPlot();
    }

    let links = this.filterLinks(activeSubreddit, "mentions", "descending");
    let nodes = this.removeUnconnectedNodes(links);
    nodes = this.addNodeAttributes(nodes, activeSubreddit, this);
    links = this.addLinkAttributes(links, nodes);

    this.paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(links)
      .join("line")
      .attr("x1", this.width / 2)
      .attr("y1", this.height / 2)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .attr("stroke-width", (d) => d.width)
      .attr("stroke", this.getColor)
      .attr("marker-end", "url(#arrow)");

    this.circles = this.root
      .append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .on("mouseenter", (d) =>
        d3
          .select("#node-view-tooltip")
          .style("opacity", 1)
          .style("left", d3.event.pageX + 20 + "px")
          .style("top", d3.event.pageY - 40 + "px")
          .html(this.toolTipRender(d, links))
      )
      .on("mouseleave", () =>
        d3.select("#node-view-tooltip").style("opacity", 0)
      );

    this.circles
      .append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("r", (d) => d.radius)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("class", (d) => d.class);

    this.circles
      .append("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .style("font-size", (d) => d.font)
      .raise()
      .attr("text-anchor", "middle")
      .text((d) => d.id)
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    this.isDrawn = true;
  }

  toolTipRender(data, links) {
    let target = data.id;
    let link = links.find((link) => link.target == target);
    let header = `<h2><strong>${data.id}</strong></h2>`;
    let summaryFirstLine = `<p>Mentioned <strong>${link.mentions}</strong> times by ${link.source}`;
    let summarySecondLine = `<br>with AVG sentiment of <strong>${link.sentiment.toFixed(2)}</strong></p>`;
    return header + summaryFirstLine + summarySecondLine;
  }

  removeUnconnectedNodes(links) {
    let nodes = JSON.parse(JSON.stringify(this.nodes));
    let outNodes = links.map((d) => d.target);
    let inNodes = links.map((d) => d.source);
    let connectedNodes = outNodes.concat(inNodes);

    return nodes.filter((node) =>
      connectedNodes.some((connectedNode) => connectedNode == node.id)
    );
  }

  /** Apply diverging color scale to link sentiment values */
  getColor = function (link) {
    return d3.interpolateRdBu(1 - link.sentiment);
  };

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([10, 50]);
  }

  filterLinks(selected, sortField, sortDirection) {
    let links = JSON.parse(JSON.stringify(this.links));
    let outgoing = links.filter((link) => link.source == selected);

    if (sortDirection == "descending") {
      outgoing = outgoing.sort((a, b) => b[sortField] - a[sortField]);
    } else if (sortDirection == "ascending") {
      outgoing = outgoing.sort((a, b) => a[sortField] - b[sortField]);
    } else {
      throw "`sortDirection` must be 'ascending' or 'descending'";
    }
    return outgoing.slice(0, 10);
  }

  clearPlot() {
    this.circles.remove();
    this.paths.remove();
    this.isDrawn = false;
  }

  addNodeAttributes(nodes, selected, that) {
    let angle = 0;
    let adjust = Math.PI / 5;
    for (let i in nodes) {
      if (nodes[i].id == selected) {
        nodes[i].x = this.width / 2;
        nodes[i].y = this.height / 2;
        nodes[i].selected = true;
        nodes[i].radius = 55;
        nodes[i].class = "selectedNode";
        nodes[i].font = 14;
      } else {
        nodes[i].x = this.width / 2 + this.radius * Math.cos(angle);
        nodes[i].y = this.height / 2 + this.radius * Math.sin(angle);
        nodes[i].selected = false;
        nodes[i].radius = 40;
        nodes[i].class = "otherNode";
        nodes[i].angle = angle;
        nodes[i].font = 9;
        angle += adjust;
      }
    }
    return nodes;
  }

  addLinkAttributes(links, nodes) {
    for (let link of links) {
      let node = nodes.find((node) => node.id == link.target);
      let width = this.widthScale(link.mentions);
      link.width = width;
      link.x = node.x;
      link.y = node.y;
      link.angle = node.angle;
    }
    return links;
  }
}
