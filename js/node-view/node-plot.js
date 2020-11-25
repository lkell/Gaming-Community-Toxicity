class NodePlot {
  constructor(root, width, height, nodes, links, colorScale, gamingSubreddits) {
    this.width = width;
    this.height = height;
    this.center = [this.width / 2, this.height / 2];
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

    this.setupDropDown();
  }

  setupDropDown() {
    // https://stackoverflow.com/questions/26709969/call-javascript-function-onchange-event-of-dropdown-list
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
    // https://stackoverflow.com/questions/33705412/drop-down-menu-over-d3-svg
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

    this.root
      .append("defs")
      .append("marker")
      .attr("id", "nodeArrow")
      .attr("markerUnits", "userSpaceOnUse")
      .attr("markerHeight", 100)
      .attr("markerWidth", 100)
      // .attr("refX", 57)
      .attr("refX", 80)
      .attr("refY", 5)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 15 5.25, 0 10.5")
      .style("fill", "#336EFF")
      .attr("stroke", "black");

    let links = this.filterLinks(this.activeSubreddit);
    let nodes = this.removeUnconnectedNodes(links);
    nodes = this.addNodeAttributes(nodes, this.activeSubreddit, this);
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
      .text((d) => d.displayName)
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
    let summarySecondLine = `<br>with AVG sentiment of <strong>${link.sentiment.toFixed(
      2
    )}</strong></p>`;
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
    return d3.scaleLinear().domain([minimum, maximum]).range([3, 50]);
  }

  filterLinks(selected) {
    let links = JSON.parse(JSON.stringify(this.links));
    let outgoing = links.filter((link) => link.source == selected);

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

  addNodeAttributes(nodes, selected, that) {
    let angle = 0;
    let adjust = Math.PI / 5;
    for (let i in nodes) {
      if (nodes[i].id == selected) {
        nodes[i].x = this.center[0];
        nodes[i].y = this.center[1];
        nodes[i].selected = true;
        nodes[i].radius = 55;
        nodes[i].class = "selectedNode";
        nodes[i].font = 14;
        nodes[i].displayName = nodes[i].id;
      } else {
        nodes[i].x = this.center[0] + this.radius * Math.cos(angle);
        nodes[i].y = this.center[1] + this.radius * Math.sin(angle);
        nodes[i].selected = false;
        nodes[i].radius = 40;
        nodes[i].class = "otherNode";
        nodes[i].angle = angle;
        nodes[i].font = 12;
        angle += adjust;
        nodes[i].displayName = this.truncateName(nodes[i].id);
      }
    }
    return nodes;
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
      let width = this.widthScale(link.mentions);
      link.width = width;
      link.x = node.x;
      link.y = node.y;
      link.angle = node.angle;
    }
    return links;
  }
}
