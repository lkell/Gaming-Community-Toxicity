// FYI: Used this as a reference:
// https://github.com/asielen/D3_Reusable_Charts/blob/master/distro_chart/distrochart.js
// PJW

class ReadabilityViolinPlot {

	constructor(data) {
        this.subreddit = 'SELECT SUBREDDIT';
		this.data = data;
		this.width = 475;
		this.height = 300;
		this.xMargin = 20;
		this.yMargin = 20;
		this.plotInfo = {};
        this.bandwidth = 5;
		this.resolution = 1000;
        this.transitionDuration = 500;
		this.svg = d3.select('#summary-view-readability-violin-card')
	        .append('svg')
	        .attr('width', this.width + this.xMargin)
	        .attr('height', this.height + this.yMargin)
	        .attr('id', 'summary-readability-violin-plot-svg');
        this.addTitle();
        this.svg.append('circle')
            .attr('id', 'summary-readability-violin-median');
        this.svg.append('rect')
            .attr('id', 'summary-readability-violin-quartile-box');
        this.prepareViolin();
        this.readabilityScale = this.createReadabilityScale();
        this.tooltip = d3.select('body')
            .append('div')
            .attr('id', 'summary-view-readability-violin-plot-tooltip')
            .classed('tooltip', true);
	}

	createReadabilityScale() {
		return d3.scaleLinear()
			.domain([-5, 25])
			.range([this.xMargin / 2, this.width])
			.clamp(true);
	}

	createYScale(data) {
		return d3.scaleLinear()
            .range([this.yMargin / 2, this.height / 2])
            .domain([0, 0.095])
            .clamp(true);
	}

	draw(subreddit) {
        this.subreddit = subreddit;
        this.changeTitle(subreddit);
		this.prepareData(subreddit);
		this.createKdeData();
        this.yScale = this.createYScale();
		let that = this;

		let area = d3.area()
            .curve(d3.curveCardinal)
            .x(function (d) {return that.readabilityScale(d.x)})
            .y0(0)
            .y1(function (d) {return that.yScale(d.y)});

        let line = d3.line()
            .curve(d3.curveCardinal)
            .x(function (d) {return that.readabilityScale(d.x)})
            .y(function (d) {return that.yScale(d.y)});

        this.plotInfo.objs.left.area
            .join('path')
            .datum(this.plotInfo.kdedata)
            .transition()
            .duration(this.transitionDuration)
            .attr("d", area);
        this.plotInfo.objs.left.line
            .join('path')
            .datum(this.plotInfo.kdedata)
            .transition()
            .duration(this.transitionDuration)
            .attr("d", line);

        this.plotInfo.objs.right.area
            .join('path')
            .datum(this.plotInfo.kdedata)
            .transition()
            .duration(this.transitionDuration)
            .attr("d", area);
        this.plotInfo.objs.right.line
            .join('path')
            .datum(this.plotInfo.kdedata)
            .transition()
            .duration(this.transitionDuration)
            .attr("d", line);

        this.plotInfo.objs.left.g.attr("transform", "translate(0," + 150 + ")  scale(1,-1)");
        this.plotInfo.objs.right.g.attr("transform", "translate(0," + 150 + ")");

        this.drawReadabilityAxis();
        this.drawQuartileBox();
        this.drawMedian();
        
	}

    addTitle() {
        d3.select('#summary-readability-violin-plot-svg')
            .append("text")
            .classed("title", true)
            .attr('id', 'summary-readability-violin-title');
    }

    changeTitle(subreddit) {
        d3.select('#summary-readability-violin-title')
            .attr("x", 15)
            .attr("y", 25)
            .style("font-size", 15)
            .attr("text-decoration", "underline")
            .text("Comment AutoReadabilityIndex of " + subreddit);
    }

	prepareData(subreddit) {
        this.plotInfo.values = objectToArray(this.data[subreddit]).map(d => d.AutoReadabilityIndex);
        this.plotInfo.values.sort(d3.ascending);
        this.plotInfo.metrics = {};
        this.plotInfo.metrics = calcMetrics(this.plotInfo.values);
    }

    createKdeData(data)  {
    	this.plotInfo.kde = kernelDensityEstimator(eKernel(this.bandwidth), this.readabilityScale.ticks(this.resolution));
        this.plotInfo.kdedata = this.plotInfo.kde(this.plotInfo.values);
    }
    
    prepareViolin() {
    	this.plotInfo.objs = {};
        this.plotInfo.objs.g = this.svg.append("g").attr("class", "violin-plot");
        this.plotInfo.objs.left = {area: null, line: null, g: null};
        this.plotInfo.objs.right = {area: null, line: null, g: null};

        this.plotInfo.objs.left.g = this.plotInfo.objs.g.append("g");
        this.plotInfo.objs.right.g = this.plotInfo.objs.g.append("g");

        //Area
        this.plotInfo.objs.left.area = this.plotInfo.objs.left.g.append("path")
            .classed('summary-violin', true)
            .classed('summry-violin-area', true);

        this.plotInfo.objs.right.area = this.plotInfo.objs.right.g.append("path")
            .classed('summary-violin', true)
            .classed('summry-violin-area', true);

        //Lines
        this.plotInfo.objs.left.line = this.plotInfo.objs.left.g.append("path")
            .classed('summary-violin', true)
            .classed('summary-violin-line', true);

        this.plotInfo.objs.right.line = this.plotInfo.objs.right.g.append("path")
            .classed('summary-violin', true)
            .classed('summary-violin-line', true);
    }

    drawReadabilityAxis() {
        this.svg.selectAll('.summary-violin-x-axis').remove();
        this.svg.append('g')
            .attr('transform', 'translate(0' + ',' + (this.height / 2) + ')')
            .call(
                d3.axisBottom()
                    .scale(this.readabilityScale)
                    .ticks(5)
            )
            .classed('summary-violin-x-axis', true);

        this.svg.append('g')
            .attr('transform', 'translate(0' + ',' + (this.height / 2) + ')')
            .call(
                d3.axisTop()
                    .scale(this.readabilityScale)
                    .ticks(3)
                    .tickFormat('')
            )
            .classed('summary-violin-x-axis', true);

        this.addAxisLabels();
    }

    addAxisLabels() {
        this.svg.append('text')
            .attr('x', this.readabilityScale(1))
            .attr('y', this.yScale(5) + 30)
            .style('text-anchor', 'middle')
            .style('font-size', 14)
            .style('fill', 'white')
            .text('1=5-6 y/o');

        this.svg.append('text')
            .attr('x', this.readabilityScale(14))
            .attr('y', this.yScale(5) + 30)
            .style('text-anchor', 'middle')
            .style('font-size', 14)
            .style('fill', 'white')
            .text('14=24+ y/o');
    }

    drawMedian() {
        let that = this;
        this.svg.select('#summary-readability-violin-median')
            .raise()
            .on('mouseover', function(event, d) { 
                that.tooltip.html(that.medianTooltipRender(that.plotInfo.metrics, that.subreddit))
                    .style('opacity', .9)
                    .style('left', (event.pageX) + 10 + 'px')
                    .style('top', (event.pageY) - 40 + 'px');
                }
            )
            .on('mouseout', function(d) {that.tooltip.style('opacity', 0)})
            .transition()
            .duration(this.transitionDuration)
            .attr('cx', this.readabilityScale(this.plotInfo.metrics.median))
            .attr('cy', this.height / 2)
            .attr('r', 5);
    }

    medianTooltipRender(d, subreddit) {
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>Median:\t' + d.median + '</p>';
        return outputString;
    }

    drawQuartileBox() {
        let that = this;
        this.svg.select('#summary-readability-violin-quartile-box')
            .raise()
            .on('mouseover', function(event, d) { 
                that.tooltip.html(that.metricsTooltipRender(that.plotInfo.metrics, that.subreddit))
                    .style('opacity', .9)
                    .style('left', (event.pageX) + 10 + 'px')
                    .style('top', (event.pageY) - 150 + 'px');
                }
            )
            .on('mouseout', function(d) {that.tooltip.style('opacity', 0)})
            .transition()
            .duration(this.transitionDuration)
            .attr('height', 20)
            .attr('x', this.readabilityScale(this.plotInfo.metrics.quartile1))
            .attr('y', this.height / 2 - this.yMargin / 2)
            .attr('width', this.readabilityScale(this.plotInfo.metrics.quartile3) - this.readabilityScale(this.plotInfo.metrics.quartile1));
    }

    metricsTooltipRender(d, subreddit) {
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>Median:\t' + d.median + '</p>';
        outputString += '<p>Mean:\t' + d.mean + '</p>';
        outputString += '<p>Max:\t' + d.max + '</p>';
        outputString += '<p>Min:\t' + d.min + '</p>';
        outputString += '<p>Interquartile Range:\t' + d.iqr + '</p>';
        outputString += '<p>1st Quartile:\t' + d.quartile1 + '</p>';
        outputString += '<p>3rd Quartile:\t' + d.quartile3 + '</p>';
        return outputString;
    }
	
}