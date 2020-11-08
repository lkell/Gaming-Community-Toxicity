// FYI: Used this as a reference:
// https://github.com/asielen/D3_Reusable_Charts/blob/master/distro_chart/distrochart.js
// PJW

class ViolinPlot {

	constructor(data) {
		this.data = data;
		this.width = 400;
		this.height = 300;
		this.xMargin = 20;
		this.yMargin = 20;
		this.plotInfo = {};
        this.bandwidth = 0.05
		this.resolution = 1000;
		this.svg = d3.select('#summary-view-container')
	        .append('svg')
	        .attr('width', this.width + this.xMargin)
	        .attr('height', this.height + this.yMargin)
	        .attr('id', 'summary-violin-plot-svg');
        this.sentimentScale = this.createSentimentScale();
	}

	createSentimentScale() {
		return d3.scaleLinear()
			.domain([-1, 1])
			.range([this.xMargin/2, this.width])
			.clamp(true);
	}

	createYScale(data) {
		return d3.scaleLinear()
            .range([this.yMargin/2, this.height/2])
            .domain([d3.min(this.plotInfo.kdedata, function (d) {return d.y;}), d3.max(this.plotInfo.kdedata, function (d) {return d.y;})])
            .clamp(true);
	}

	// TODO: Using distrochart.js code, pull metrics from boxplot and get violin running PJW
	draw(subreddit) {
		this.prepareData(subreddit);
		this.createKdeData();
        this.yScale = this.createYScale();
		let that = this;

		this.prepareViolin();

        let area = d3.area()
            .curve(d3.curveCardinal)
            .x(function (d) {return that.sentimentScale(d.x)})
            .y0(0)
            .y1(function (d) {return that.yScale(d.y)});

        let line = d3.line()
            .curve(d3.curveCardinal)
            .x(function (d) {return that.sentimentScale(d.x)})
            .y(function (d) {return that.yScale(d.y)});

        this.plotInfo.objs.left.area
            .datum(this.plotInfo.kdedata)
            .attr("d", area);
        this.plotInfo.objs.left.line
            .datum(this.plotInfo.kdedata)
            .attr("d", line)
			.attr('fill', 'none')
			.attr('stroke', 'red')
			.attr('stroke-width', 1.5);

        this.plotInfo.objs.right.area
            .datum(this.plotInfo.kdedata)
            .attr("d", area);
        this.plotInfo.objs.right.line
            .datum(this.plotInfo.kdedata)
            .attr("d", line)
			.attr('fill', 'none')
			.attr('stroke', 'blue')
			.attr('stroke-width', 1.5);

        this.plotInfo.objs.left.g.attr("transform", "translate(0," + 150 + ")  scale(1,-1)");
        this.plotInfo.objs.right.g.attr("transform", "translate(0," + 150 + ")");
	}

	prepareData(subreddit) {
        this.plotInfo.values = objectToArray(this.data[subreddit]).map(d => d.CompoundSentiment);
        this.plotInfo.values.sort(d3.ascending);
        this.plotInfo.metrics = {};
        this.plotInfo.metrics = calcMetrics(this.plotInfo.values);
    }

    createKdeData(data)  {
    	this.plotInfo.kde = kernelDensityEstimator(eKernel(this.bandwidth), this.sentimentScale.ticks(this.resolution));
        this.plotInfo.kdedata = this.plotInfo.kde(this.plotInfo.values);
    }

            

    // /**
    //  * Create the svg elements for the violin plot
    //  */
    prepareViolin() {
    	this.plotInfo.objs = {};
        this.plotInfo.objs.g = this.svg.append("g").attr("class", "violin-plot");
        this.plotInfo.objs.left = {area: null, line: null, g: null};
        this.plotInfo.objs.right = {area: null, line: null, g: null};

        this.plotInfo.objs.left.g = this.plotInfo.objs.g.append("g");
        this.plotInfo.objs.right.g = this.plotInfo.objs.g.append("g");

        //Area
        this.plotInfo.objs.left.area = this.plotInfo.objs.left.g.append("path")
            .attr("class", "area")
            // .style("fill", chart.violinPlots.color(cName));
            .style('fill', 'red')
        this.plotInfo.objs.right.area = this.plotInfo.objs.right.g.append("path")
            .attr("class", "area")
            // .style("fill", chart.violinPlots.color(cName));
            .style('fill', 'blue')

        //Lines
        this.plotInfo.objs.left.line = this.plotInfo.objs.left.g.append("path")
            .attr("class", "line")
            .attr("fill", 'none')
            // .style("stroke", chart.violinPlots.color(cName));
        this.plotInfo.objs.right.line = this.plotInfo.objs.right.g.append("path")
            .attr("class", "line")
            .attr("fill", 'none')
            // .style("stroke", chart.violinPlots.color(cName));

    }
	
}