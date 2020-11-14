// FYI: Used this as a reference:
// https://github.com/asielen/D3_Reusable_Charts/blob/master/distro_chart/distrochart.js
// PJW

class ViolinPlot {

	constructor(data) {
        this.subreddit = 'SELECT SUBREDDIT';
		this.data = data;
		this.width = 475;
		this.height = 300;
		this.xMargin = 20;
		this.yMargin = 20;
		this.plotInfo = {};
        this.bandwidth = 0.05
		this.resolution = 1000;
		this.svg = d3.select('#summary-view-violin-card')
	        .append('svg')
	        .attr('width', this.width + this.xMargin)
	        .attr('height', this.height + this.yMargin)
	        .attr('id', 'summary-violin-plot-svg');
        this.sentimentScale = this.createSentimentScale();
        this.tooltip = d3.select('body')
            .append('div')
            .attr('id', 'summary-view-violin-plot-tooltip')
            .classed('tooltip', true);
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

	draw(subreddit) {
        this.subreddit = subreddit;
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
            .attr("d", line);

        this.plotInfo.objs.right.area
            .datum(this.plotInfo.kdedata)
            .attr("d", area);
        this.plotInfo.objs.right.line
            .datum(this.plotInfo.kdedata)
            .attr("d", line);

        this.plotInfo.objs.left.g.attr("transform", "translate(0," + 150 + ")  scale(1,-1)");
        this.plotInfo.objs.right.g.attr("transform", "translate(0," + 150 + ")");

        this.drawSentimentAxis();
        this.drawQuartileBox();
        this.drawMedian();
        
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

    drawSentimentAxis() {
        this.svg.append('g')
            .attr('transform', 'translate(0' + ',' + (this.height / 2) + ')')
            .call(
                d3.axisBottom()
                    .scale(this.sentimentScale)
                    .ticks(3)
            )
            .classed('summary-violin-x-axis', true);

        this.svg.append('g')
            .attr('transform', 'translate(0' + ',' + (this.height / 2) + ')')
            .call(
                d3.axisTop()
                    .scale(this.sentimentScale)
                    .ticks(3)
                    .tickFormat('')
            )
            .classed('summary-violin-x-axis', true);
    }

    drawMedian() {
        let that = this;
        this.svg.append('circle')
            .attr('cx', this.sentimentScale(this.plotInfo.metrics.median))
            .attr('cy', this.height / 2)
            .attr('r', 5)
            .attr('id', 'summary-violin-median')
            .on('mouseover', function(d) { 
                that.tooltip.html(that.medianTooltipRender(that.plotInfo.metrics, that.subreddit))
                    .style('opacity', .9)
                    .style('left', (d3.event.pageX) + 10 + 'px')
                    .style('top', (d3.event.pageY) + 10 + 'px');
                }
            )
            .on('mouseout', function(d) {that.tooltip.style('opacity', 0)});
    }

    medianTooltipRender(d, subreddit) {
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>Median:\t' + d.median + '</p>';
        return outputString;
    }

    drawQuartileBox() {
        let that = this;
        this.svg.append('rect')
            .attr('id', 'summary-violin-quartile-box')
            .attr('height', 20)
            .attr('x', this.sentimentScale(this.plotInfo.metrics.quartile1))
            .attr('y', this.height / 2 - this.yMargin / 2)
            .attr('width', this.sentimentScale(this.plotInfo.metrics.quartile3) - this.sentimentScale(this.plotInfo.metrics.quartile1))
            .on('mouseover', function(d) { 
                that.tooltip.html(that.metricsTooltipRender(that.plotInfo.metrics, that.subreddit))
                    .style('opacity', .9)
                    .style('left', (d3.event.pageX) + 10 + 'px')
                    .style('top', (d3.event.pageY) + 10 + 'px');
                }
            )
            .on('mouseout', function(d) {that.tooltip.style('opacity', 0)});
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