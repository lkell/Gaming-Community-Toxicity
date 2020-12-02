/**
 * Visualize the close up outgoing sentiment interactions of a selected gaming
 * subreddit.
 */
class NodePlot {
  constructor(root, width, height, nodes, links, colorScale) {
    this.width = width;
    this.height = height;
    this.center = [this.width / 2 - 30, this.height / 2];
    this.parent = root;
    this.root = d3
      .select(root)
      .append("svg")
      .classed("node-plot", true)
      .attr("width", this.width)
      .attr("height", this.height);

    this.tooltip = d3
      .select("body")
      .append("div")
      .attr("id", "node-view-tooltip")
      .classed("tooltip", true);

    this.radius = 180;

    this.nodes = JSON.parse(JSON.stringify(nodes));
    this.links = JSON.parse(JSON.stringify(links));
    this.widthScale = this.makeStrokeWidthScale(this.links);
    this.colorScale = colorScale;

    this.circles;
    this.paths;

    this.isDrawn = false;
    this.sortTargetsBy = "mentions";

    this.minLinks = 0;

    this.setupDropDown();
    this.setupSlider();
    this.addWidthLegend();
    this.setupArrowMarkers();
  }

  addWidthLegend() {
    let maximum = d3.max(this.links, (link) => link.mentions);
    let minimum = 1;

    let edgeHeight = 40;
    let edgeSpacing = 60;

    let edgeData = [
      {
        label: minimum,
        width: this.widthScale(minimum) / 2,
        x: 0,
      },
      {
        label: maximum,
        width: this.widthScale(maximum) / 2,
        x: this.widthScale(minimum) / 2 + edgeSpacing,
      },
    ];

    let legend = this.root
      .append("g")
      .attr("id", "node-plot-width-legend", true)
      .attr("transform", "translate(488,526)")
      .attr("fill", "white");
    
  legend
      .append("rect")
      .attr("x", -58)
      .attr("y", -35)
      .attr("width", 180)
      .attr("height", 100)
      .attr("rx", 10)
      .attr("fill", "none")
      .style("opacity", 0.5)
      .attr("stroke", "white");

    legend
      .append("text")
      .attr("font-size", 12)
      .attr("x", (edgeData[1].x - edgeData[0].x) / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .text("Edge Widths: #Hyperlinks");

    let edges = legend
      .selectAll("g")
      .data(edgeData)
      .join("g")
      .attr("fill", "white");

    edges
      .append("line")
      .attr("x1", (d) => d.x)
      .attr("x2", (d) => d.x)
      .attr("y1", edgeHeight)
      .attr("y2", 0)
      .attr("stroke", "white")
      .attr("stroke-width", (d) => d.width)
      .attr("marker-end", "url(#nodeArrowLegend)");

    edges
      .append("text")
      .attr("x", (d) => d.x)
      .attr("y", edgeHeight + 12)
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .text((d) => d.label);

    return;
  }

  setupSlider() {
    /** 
     * FYI: Used the following as a reference:
     * https://github.com/johnwalley/d3-simple-slider
     * LJK
    */
    var slider = d3
      .sliderHorizontal()
      .min(1)
      .max(12)
      .step(1)
      .width(200)
      .height(60)
      .height(30)
      .fill("#FF8b60")
      .displayValue(false)
      .on("onchange", (val) => {
        this.minLinks = val;
        this.draw();
      });

    let sliderElem = this.root
      .append("g")
      .call(slider)
      .attr("transform", "translate(350,55)");

    sliderElem.selectAll("text").attr("fill", "black");

    sliderElem
      .append("text")
      .attr("y", -10)
      .attr("x", 105)
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .text("Minimum #hyperlinks");
  }

  setupDropDown() {
    /**
     * FYI: Used the following as a reference:
     * https://stackoverflow.com/questions/26709969/call-javascript-function-onchange-event-of-dropdown-list
     * LJK
    */
    this.addDropDown();
    let dropdown = d3.select(".nodeSelection");
    dropdown.style("opacity", 0);
    let plot = this;
    $(".nodeSelection").change(function () {
      let selection = $(this).val();
      plot.sortTargetsBy = selection;
      plot.draw();
    });
  }

  addDropDown() {
    /** 
     * FYI: Used the following as a reference
     * https://stackoverflow.com/questions/33705412/drop-down-menu-over-d3-svg
     * LJK
    */
    let dropdown = d3
      .select(this.parent)
      .append("select")
      .classed("nodeSelection", true);
    dropdown
      .append("option")
      .attr("value", "mentions")
      .text("Number of mentions");
    dropdown
      .append("option")
      .attr("value", "positivity")
      .text("Positive sentiment");
    dropdown
      .append("option")
      .attr("value", "negativity")
      .text("Negative sentiment");
  }

  addTitle(activeSubreddit) {
    this.root.select(".title").remove();

    this.root
      .append("text")
      .classed("title", true)
      .attr("x", 15)
      .attr("y", 25)
      .style("font-size", 16)
      .attr("text-decoration", "underline")
      .text(`${activeSubreddit}'s Top Outgoing Subreddits by`);
  }

  setupArrowMarkers() {
    this.root
      .append("defs")
      .append("marker")
      .attr("id", "nodeArrow")
      .attr("markerUnits", "userSpaceOnUse")
      .attr("markerHeight", 100)
      .attr("markerWidth", 100)
      .attr("refX", 80)
      .attr("refY", 5.2)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 15 5.25, 0 10.5")
      .style("fill", "#9494FF")
      .attr("stroke", "black");

    this.root
      .append("defs")
      .append("marker")
      .attr("id", "nodeArrowLegend")
      .attr("markerUnits", "userSpaceOnUse")
      .attr("markerHeight", 100)
      .attr("markerWidth", 100)
      .attr("refX", 27)
      .attr("refY", 5.2)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 15 5.25, 0 10.5")
      .style("fill", "#9494FF")
      .attr("stroke", "black");
  }

  updatePlot(activeSubreddit) {
    this.activeSubreddit = activeSubreddit;
    this.draw();
  }

  draw() {
    if (this.isDrawn) {
      this.clearPlot();
    } else {
      d3.select(".nodeSelection").style("opacity", 1);
    }
    this.addTitle(this.activeSubreddit);

    let links = this.filterLinks(this.activeSubreddit, this.minLinks);
    let nodes = this.removeUnconnectedNodes(links);
    nodes = this.addNodeAttributes(nodes, links, this.activeSubreddit);
    links = this.addLinkAttributes(links, nodes);

    this.paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(links)
      .join("line")
      .attr("x1", this.center[0])
      .attr("y1", this.center[1])
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .attr("stroke-width", (d) => d.width)
      .attr("stroke", (d) => this.colorScale(d.sentiment))
      .attr("marker-end", "url(#nodeArrow)");

    this.circles = this.root
      .append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .on("mouseenter", (event, d) =>
        d3
          .select("#node-view-tooltip")
          .style("opacity", 1)
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY - 40 + "px")
          .style("opacity", 0.9)
          .html(this.toolTipRender(d))
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
      .text((d) => d.displayName)
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    this.isDrawn = true;
  }

  toolTipRender(data) {
    let header = `<h2><strong>${data.id}</strong></h2>`;
    let summaryFirstLine;
    let summarySecondLine;
    if (data.class == "otherNode") {
      summaryFirstLine = `<p>Linked <strong>${data.mentions}</strong> times by ${this.activeSubreddit}`;
      summarySecondLine = `<br>with AVG sentiment of <strong>${data.sentiment.toFixed(
        2
      )}</strong></p>`;
    } else {
      summaryFirstLine = `<p>${data.totalHyperlinks} links to ${data.interactions} other subreddits`;
      summarySecondLine = `<br>with AVG sentiment of <strong>${data.positivity.toFixed(
        2
      )}</strong></p>`;
    }
    return header + summaryFirstLine + summarySecondLine;
  }

  removeUnconnectedNodes(links) {
    let nodes = JSON.parse(JSON.stringify(this.nodes));
    let outNodes = links.map((d) => d.target);
    let inNodes = links.map((d) => d.source);
    let connectedNodes = outNodes.concat(inNodes);

    return nodes.filter(
      (node) =>
        connectedNodes.some((connectedNode) => connectedNode == node.id) ||
        node.id == this.activeSubreddit
    );
  }

  /** Apply diverging color scale to link sentiment values */
  getColor = function (link) {
    return d3.interpolateRdBu(1 - link.sentiment);
  };

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([4, 100]);
  }

  filterLinks(selected) {
    let links = JSON.parse(JSON.stringify(this.links));
    let outgoing = links.filter(
      (link) => link.source == selected && link.mentions >= this.minLinks
    );

    if (this.sortTargetsBy === "mentions") {
      outgoing = outgoing.sort((a, b) => b.mentions - a.mentions);
    } else if (this.sortTargetsBy === "positivity") {
      outgoing = outgoing.sort((a, b) => b.sentiment - a.sentiment);
    } else if (this.sortTargetsBy === "negativity") {
      outgoing = outgoing.sort((a, b) => a.sentiment - b.sentiment);
    } else {
      throw "`sortTargetsBy` must be one of 'mentions', 'positivity', 'negativity'";
    }
    return outgoing.slice(0, 10);
  }

  clearPlot() {
    this.circles.remove();
    this.paths.remove();
    this.isDrawn = false;
  }

  addNodeAttributes(nodes, links, selected) {
    nodes = JSON.parse(JSON.stringify(nodes));

    // let angle = 0;
    let angle = -Math.PI / 2;
    let adjust = Math.PI / 5;

    let sourceNode = nodes.find((node) => node.id == selected);
    sourceNode.x = this.center[0];
    sourceNode.y = this.center[1];
    sourceNode.selected = true;
    sourceNode.radius = 63;
    sourceNode.class = "selectedNode";
    sourceNode.font = sourceNode.id.length >= 17 ? 12 : 14;
    sourceNode.displayName = sourceNode.id;

    let targetNodes = nodes.filter((node) => node.id != selected);
    for (let targetNode of targetNodes) {
      let link = links.find((link) => link.target == targetNode.id);
      targetNode.mentions = link.mentions;
      targetNode.sentiment = link.sentiment;
    }

    if (this.sortTargetsBy === "mentions") {
      targetNodes.sort((a, b) => b.mentions - a.mentions);
    } else if (this.sortTargetsBy === "positivity") {
      targetNodes.sort((a, b) => b.sentiment - a.sentiment);
    } else if (this.sortTargetsBy === "negativity") {
      targetNodes.sort((a, b) => a.sentiment - b.sentiment);
    }

    for (let i in targetNodes) {
      targetNodes[i].x = this.center[0] + this.radius * Math.cos(angle);
      targetNodes[i].y = this.center[1] + this.radius * Math.sin(angle);
      targetNodes[i].selected = false;
      targetNodes[i].radius = 43;
      targetNodes[i].class = "otherNode";
      targetNodes[i].angle = angle;
      targetNodes[i].font = 12;
      angle += adjust;
      targetNodes[i].displayName = this.truncateName(targetNodes[i].id);
    }
    return targetNodes.concat(sourceNode);
  }

  truncateName(name) {
    let maxLength = 9;
    if (name.length > maxLength) {
      return name.slice(0, maxLength) + "...";
    }
    return name;
  }

  addLinkAttributes(links, nodes) {
    for (let link of links) {
      let node = nodes.find((node) => node.id == link.target);
      let width = this.widthScale(link.mentions) / 2;
      link.width = width;
      link.x = node.x;
      link.y = node.y;
      link.angle = node.angle;
    }
    return links;
  }
}
