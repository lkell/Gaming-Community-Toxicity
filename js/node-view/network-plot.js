/**
 * Visualize the sentiment/link topology of the redding gaming community.
 */
class NetworkPlot {
  constructor(root, width, height, nodes, links, colorscale, updateFun) {
    this.nodes = nodes;
    this.links = links;

    // numeric constants
    this.width = width;
    this.height = height;
    this.shiftX = 275;
    this.shiftY = 310;
    this.unselectedPathOpacity = 0.07;

    // initialize SVG elements
    this.root = d3
      .select(root)
      .append("svg")
      .classed("network-plot", true)
      .attr("width", this.width + "px")
      .attr("height", this.height + "px")
      .attr("overflow", "scroll");

    this.root
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.width)
      .attr("height", this.height)
      .style("opacity", 0)
      .on("click", (e) => {
        this.clearHighlights();
        this.circles.selectAll("circle").style("opacity", 1);
        this.clicked = true;
      })
      .on("mouseover", (e) => {
        this.highlightRegion(null);
        if (this.clicked) {
          this.circles.selectAll("circle").style("opacity", 1);
        }
      });
    this.circles;
    this.paths;

    // scales
    this.colorScale = colorscale;
    this.radiusScale = this.makeRadiusSale();
    this.widthScale = this.makeStrokeWidthScale(this.links);

    // properties for subreddit updating
    this.updateFun = updateFun;
    this.activeSubreddit;
    this.minMentions = 0;
    this.connectedNodes = this.nodes.map((node) => node.id);
    this.clicked = false;
    this.highlightedNode;

    this.setupPlot();
  }

  setupPlot() {
    this.addTitle();
    this.addLegend();
    this.setupSlider();
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

  addLegend() {
    this.root
      .append("rect")
      .attr("x", 765)
      .attr("y", 450)
      .attr("width", 230)
      .attr("height", 140)
      .attr("rx", 10)
      .attr("fill", "none")
      // .attr("stroke-width", 2)
      .attr("stroke", "white");
    this.addColorLegend();
    this.addSizeLegend();
  }

  addColorLegend() {
    // https://observablehq.com/@d3/color-legend
    // https://stackoverflow.com/questions/60443356/legend-not-appearing-when-using-document-createelementcanvas

    const tickSize = 6;
    const width = 200;
    const height = 44 + tickSize;
    const marginTop = 18;
    const marginRight = 0;
    const marginBottom = 16 + tickSize;
    const marginLeft = 0;
    const ticks = width / 64;
    // const shiftX = 750;
    const shiftX = 780;
    const shiftY = 530;

    let tickAdjust = (g) =>
      g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);

    function ramp(color, n = 256) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      d3.select(canvas).attr("width", n).attr("height", 1);
      for (let i = 0; i < n; ++i) {
        context.fillStyle = color((n - i) / (n - 1));
        context.fillRect(i, 0, 1, 1);
      }
      return canvas;
    }

    let color = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

    let x = Object.assign(
      color
        .copy()
        .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
      {
        range() {
          return [marginLeft, width - marginRight];
        },
      }
    );

    this.root
      .append("image")
      .attr("alt", "Sentiment Color Legend")
      .attr("x", marginLeft + shiftX)
      .attr("y", marginTop + shiftY)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    this.root
      .append("g")
      .attr(
        "transform",
        `translate(${0 + shiftX},${height - marginBottom + shiftY})`
      )
      .call(
        d3
          .axisBottom(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
      )
      .call(tickAdjust)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", width / 2)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "middle")
          .attr("font-size", 12)
          .text("Compound Sentiment")
      );
  }

  addSizeLegend() {
    let min = d3.min(this.nodes, (node) => node.totalHyperlinks);
    let max = d3.max(this.nodes, (node) => node.totalHyperlinks);

    let circleSpacing = 100;

    let legendData = [
      { totalHyperlinks: min, radius: this.radiusScale(min), x: 0, y: 0 },
      {
        totalHyperlinks: max,
        radius: this.radiusScale(max),
        x: circleSpacing,
        y: 0,
      },
    ];

    let legend = this.root
      .append("g")
      .attr("id", "network-radius-legend")
      .attr("transform", "translate(830,490)")
      .attr("fill", "white");

    legend
      .append("text")
      .attr("x", circleSpacing / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text("#Outbound Gaming Hyperlinks");

    let legendCircles = legend.selectAll("g").data(legendData).join("g");

    legendCircles
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .style("fill-opacity", 0);

    legendCircles
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", (d) => d.x + 1)
      .attr("y", 25)
      .attr("font-size", 10)
      .text((d) => d.totalHyperlinks);
  }

  setupSlider() {
    // https://github.com/johnwalley/d3-simple-slider

    var slider = d3
      .sliderHorizontal()
      .min(1)
      .max(24)
      .step(1)
      .width(200)
      .height(60)
      .height(30)
      .fill("#9494FF")
      .displayValue(false)
      .on("onchange", (val) => {
        d3.select("#value").text(val);
        this.trimLinks(val);
        this.highlightRegion(null);
        if (this.clicked) {
          this.circles.selectAll("circle").style("opacity", 1);
        }
      });

    let sliderElem = this.root
      .append("g")
      .call(slider)
      .attr("transform", "translate(750,55)");

    sliderElem.selectAll("text").attr("fill", "black");

    sliderElem
      .append("text")
      .attr("y", -10)
      .attr("x", 105)
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .text("Minimum #hyperlinks");
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
  }

  setupCheckbox() {
    // https://stackoverflow.com/questions/38260431/onchange-event-in-a-bootstrap-checkbox
    $("#link-checkbox").change(function () {
      alert($(this).prop("checked"));
    });
  }

  makeRadiusSale() {
    let min = d3.min(this.nodes, (node) => node.totalHyperlinks);
    let max = d3.max(this.nodes, (node) => node.totalHyperlinks);
    return d3.scaleLinear().domain([min, max]).range([6, 13]);
  }

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([3, 8]);
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
      .style("fill", "#9494FF")
      .attr("stroke", "black");

    this.paths = this.root
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(this.links)
      .join("path")
      .attr("stroke", (d) => this.colorScale(d.sentiment))
      .attr("stroke-width", (d) => this.widthScale(d.mentions))
      .style("opacity", this.unselectedPathOpacity)
      .on("click", (e) => {
        this.clearHighlights();
        this.circles.selectAll("circle").style("opacity", 1);
        this.clicked = true;
      })
      .on("mouseover", () => {
        this.highlightRegion(null);
        if (this.clicked) {
          this.circles.selectAll("circle").style("opacity", 1);
        }
      })
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
      .attr("r", (d) => this.radiusScale(d.totalHyperlinks));

    this.circles
      .selectAll("circle")
      .on("mouseenter", (event, d) => this.highlightRegion(d.id));

    this.circles
      .selectAll("circle")
      .on("click", (event, d) => this.updateFun(d.id));

    this.circles
      .append("text")
      .attr("fill", "black")
      .attr("x", 9)
      .attr("y", -18)
      .style("font-size", 10)
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
  }

  updateSelectedSubreddit(selection) {
    this.clicked = false;
    this.activeSubreddit = selection;
    this.highlightRegion(selection);
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

  highlightRegion(selection) {
    // https://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
    d3.selection.prototype.moveToFront = function () {
      return this.each(function () {
        this.parentNode.appendChild(this);
      });
    };

    this.clearHighlights();

    if (selection !== null) {
      // fill in paths around selected node
      this.paths
        .filter((d) => d.mentions >= this.minMentions)
        .filter((d) => d.target.id == selection || d.source.id == selection)
        .style("opacity", 1)
        .moveToFront();

      // fill in the selected node
      this.circles
        .filter((d) =>
          this.connectedNodes.some((connectedNode) => connectedNode == d.id)
        )
        .filter((d) => d.id == selection)
        .selectAll("circle")
        .style("opacity", 100);
    }

    if (!this.clicked) {
      // fill in paths around active node
      this.paths
        .filter((d) => d.mentions >= this.minMentions)
        .filter(
          (d) =>
            d.target.id == this.activeSubreddit ||
            d.source.id == this.activeSubreddit
        )
        .style("opacity", 1)
        .moveToFront();

      let activeCircle = this.circles
        .filter((d) =>
          this.connectedNodes.some((connectedNode) => connectedNode == d.id)
        )
        .filter((d) => d.id == this.activeSubreddit);

      // emphasize the label of the active node
      activeCircle.selectAll("text").attr("font-weight", "bold");

      // emphasize the active node
      activeCircle
        .selectAll("circle")
        .style("opacity", 100)
        .attr("stroke-width", 3)
        .attr("stroke", "#FFBE33");
    }
  }

  clearHighlights() {
    this.paths
      .filter((d) => d.mentions >= this.minMentions)
      .style("opacity", this.unselectedPathOpacity);
    this.clearCircleHighlights();
  }

  clearCircleHighlights() {
    let unHighlightedCircles = this.circles
      .filter((d) =>
        this.connectedNodes.some((connectedNode) => connectedNode == d.id)
      )
      .filter((circle) => circle.id !== this.activeSubreddit);

    unHighlightedCircles
      .selectAll("circle")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .style("opacity", 0.6);

    unHighlightedCircles.selectAll("text").attr("font-weight", "normal");
  }
}
