class NetworkPlot {
  constructor(root, width, height, nodes, links, colorscale, updateFun) {
    this.width = width;
    this.height = height;
    this.root = d3
      .select(root)
      .append("svg")
      .classed("network-plot", true)
      .attr("width", this.width + "px")
      .attr("height", this.height + "px")
      .attr("overflow", "scroll");

    this.nodes = nodes;
    // this.nodes = this.removeUnconnectedNodes(nodes, links);
    this.links = links;
    this.shiftX = 255;
    this.shiftY = 310;
    this.circles;
    this.paths;
    this.activeSubreddit;

    this.colorScale = colorscale;

    this.updateFun = updateFun;

    this.unselectedPathOpacity = 0.07;

    this.minMentions = 0;
    this.connectedNodes = this.nodes.map((node) => node.id);

    this.setupPlot();
  }

  setupPlot() {
    this.addTitle();
    this.addLegend();
    this.setupSlider();
  }

  setupSlider() {
    // https://github.com/johnwalley/d3-simple-slider
    d3.select("#node")
      .append("div")
      .attr("id", "slider")
      // .style("background-color", "darkgrey")
      // .style("background-color", "lightblue")
      // .classed("col-sm", true);
      .style("opacity", 0.5);
    d3.select("body").append("div").attr("id", "value");

    var slider = d3
      .sliderHorizontal()
      .min(1)
      .max(24)
      .step(1)
      .width(200)
      .height(60)
      .fill("lightblue")
      .displayValue(false)
      // .tickPadding("2px")
      .on("onchange", (val) => {
        d3.select("#value").text(val);
        this.trimLinks(val);
      });
    
    let added = 
    this.root
      .append("g")
      .call(slider)
      // .attr("stroke", "black")
      .attr("transform", "translate(30,55)")

    added.selectAll("text").attr("fill", "black")

    added
      .append("text")
      .attr("y", -10)
      .text("Minimum #hyperlinks");

    // d3.select("#slider")
    //   .style("position", "absolute")
    //   .style("left", "0px")
    //   .style("top", "500px")
    //   .append("svg")
    //   .attr("width", 260)
    //   .attr("height", 90)
    //   .append("g")
    //   .attr("transform", "translate(30,50)")
    //   .call(slider)
    //   .append("text")
    //   .attr("y", -20)
    //   .text("Minimum #hyperlinks")
  }

  trimLinks(minMentions) {
    this.minMentions = minMentions;
    this.paths.filter((d) => d.mentions < this.minMentions).style("opacity", 0);
    this.paths
      .filter((d) => d.mentions >= minMentions)
      .style("opacity", this.unselectedPathOpacity);
    let allowedLinks = this.links.filter(
      (link) => link.mentions >= this.minMentions
    );
    let outNodes = allowedLinks.map((d) => d.target.id);
    let inNodes = allowedLinks.map((d) => d.source.id);
    this.connectedNodes = outNodes.concat(inNodes);
    console.log(this.connectedNodes[0]);
    this.circles
      .filter(
        (d) =>
          !this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .style("opacity", 0);
    this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .style("opacity", 1);
    // let removeCircles = this.circles.filter(
    //   (d) => !this.connectedNodes.some((connectedNode) => connectedNode == d.id)
    // );
    // removeCircles.style("opacity", 0)
    // removeCircles.selectAll("circle").style("opacity", 0);
    // removeCircles.selectAll("text").style("opacity", 0);

    // let keepCircles = this.circles.filter((d) =>
    //   this.connectedNodes.some((connectedNode) => connectedNode == d.id)
    // );
    // keepCircles.selectAll("circle").style("opacity", 0.6);
    // keepCircles.selectAll("text").style("opacity", 1);
  }

  makeColorScale() {
    return d3.scaleSequential(d3.interpolateRdBu).domain([1, -1]);
  }

  addLegend() {
    this.root
      .append("g")
      .attr("class", "legendSequential")
      .attr("transform", "translate(600,500)");

    let legendSequential = d3
      .legendColor()
      .shapeWidth(100)
      .cells(10)
      .orient("horizontal")
      .scale(this.colorScale);

    this.root.select(".legendSequential").call(legendSequential);
  }

  addTitle() {
    this.root
      .append("text")
      .classed("title", true)
      .attr("x", 15)
      .attr("y", 25)
      .style("font-size", 20)
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

    let radiusScale = this.makeRadiusSale();

    let widthScale = this.makeStrokeWidthScale(this.links);

    this.paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(this.links)
      .join("path")
      .attr("stroke", (d) => this.colorScale(d.sentiment))
      .attr("stroke-width", (d) => widthScale(d.mentions))
      .style("opacity", this.unselectedPathOpacity)
      .attr("marker-end", "url(#arrow)");

    this.circles = this.root
      .append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(this.nodes)
      .join("g");

    this.circles
      .append("circle")
      .attr("fill", (d) => this.colorScale(d.positivity))
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("r", (d) => radiusScale(d.interactions));

    this.circles
      .selectAll("circle")
      .on("mouseenter", (event, d) => this.highlightRegion(d, this));

    this.circles.selectAll("circle").on("click", (event, d) => {
      this.activeSubreddit = d.id;
      this.clearCircleHighlights();
      this.updateFun(d.id);
    });

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

    simulation.tick(300);
    this.paths.attr("d", (d) => this.linkArc(d, this.shiftX, this.shiftY));
    this.circles.attr(
      "transform",
      (d) => `translate(${d.x + this.shiftX},${d.y + this.shiftY})`
    );

    // this.root.on("click", e => {
    //   this.clearHighlights()
    //   this.activeSubreddit = null;
    // });
    // this.root.on("mouseover", e => this.reHighlightRegion(this));
    // this.root.on("mouseover", (e) => this.clearHighlights());
  }

  removeUnconnectedNodes(nodes, links) {
    let outNodes = links.map((d) => d.target);
    let inNodes = links.map((d) => d.source);
    let connectedNodes = outNodes.concat(inNodes);
    return nodes.filter((node) =>
      connectedNodes.some((connectedNode) => connectedNode == node.id)
    );
  }

  linkArc(link) {
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
    return d3.scaleLinear().domain([minimum, maximum]).range([3, 8]);
  }

  highlightRegion(event, view) {
    this.clearHighlights();
    this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .selectAll("circle")
      .filter((circle) => circle.id !== this.activeSubreddit)
      .style("opacity", 0.6);

    let selectedNode = event.id;
    this.paths
      .filter((d) => d.mentions >= this.minMentions)
      .filter((d) => d.target.id == selectedNode || d.source.id == selectedNode)
      .style("opacity", 1);

    this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .filter((d) => d.id == selectedNode)
      .selectAll("circle")
      .style("opacity", 100)
      .attr("stroke", "#FFBE33")
      .attr("stroke-width", 3);
  }

  reHighlightRegion(view) {
    if (view.activeSubreddit === null) {
      return;
    }
    this.clearHighlights();
    this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .selectAll("circle")
      .filter((circle) => circle.id !== this.activeSubreddit)
      .style("opacity", 0.6);

    let selectedNode = this.activeSubreddit;
    this.paths
      .filter((d) => d.mentions >= this.minMentions)
      .filter((d) => d.target.id == selectedNode || d.source.id == selectedNode)
      .style("opacity", 1);

    this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .filter((d) => d.id == selectedNode)
      .selectAll("circle")
      .style("opacity", 100)
      // .attr("stroke", "#FFBE33")
      .attr("stroke", "#FFBE33")
      .attr("stroke-width", 3);
  }

  clearHighlights() {
    this.paths
      .filter((d) => d.mentions >= this.minMentions)
      .style("opacity", this.unselectedPathOpacity);
    this.clearCircleHighlights();
  }

  clearCircleHighlights() {
    this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .selectAll("circle")
      .filter((circle) => circle.id !== this.activeSubreddit)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .style("opacity", 1);
  }
}
