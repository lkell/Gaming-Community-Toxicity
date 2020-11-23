class PostsLineChart {

	constructor(data) {
        this.subreddit = 'SELECT SUBREDDIT';
		this.data = data;
		this.xMargin = 20;
		this.yMargin = 10;
		this.width = 575;
		this.height = 300;
		this.transitionDuration = 500;
		this.svg = d3.select('#summary-view-post-card')
	        .append('svg')
	        .attr('width', this.width + 2 * this.xMargin)
	        .attr('height', this.height + 2 * this.yMargin)
	        .attr('id', 'summary-post-svg');
    	this.timeScale = this.createTimeScale();
    	this.postScale = this.createPostScale();
        this.tooltip = d3.select('body')
            .append('div')
            .attr('id', 'summary-view-ts-posts-tooltip')
            .classed('tooltip', true);
        this.initializeLineCharts();
	}

	// TODO: Figure out why dateMin is is off by ~1 month PJW
	createTimeScale() {
		let tsArray = flattenValues(this.data, 'TIMESTAMP');
		let dateMin = d3.min(tsArray);
		let dateMax = d3.max(tsArray);
		console.log(dateMin, dateMax)
		return d3.scaleTime()
			.domain([dateMin, dateMax])
			.range([this.xMargin, this.width - this.xMargin]);
	}

	createPostScale() {
		let postArray = flattenValues(this.data, 'TIMESTAMP');
		// TODO: Find better way to get max PJW
		// for (let [_, value] of Object.entries(this.data)) {
			// console.log(objectToArray(value).length)
		// }
		let postMin = 0;
		// let postMax = postArray.length
		let postMax = 100
		return d3.scaleLinear()
			.domain([postMin, postMax])
			.range([this.height - this.yMargin, this.yMargin]);
	}

	initializeLineCharts() {
		d3.select('#summary-post-svg')
			.append('svg:path')
			.attr('id', 'postLineChart');

		d3.select('#summary-post-svg')
	}

	draw(sourceSubreddit) {
		this.subreddit = sourceSubreddit;
		let that = this;
		let summaryData = objectToArray(this.data[sourceSubreddit]);

		summaryData = this.groupByYearAndMonth(summaryData);

		this.drawTimeAxis();
		this.drawPostAxis();

		let postLineGenerator = d3.line()
			.x(d => this.timeScale(d.key))
			.y(d => this.postScale(d.value));

		let lineChart = d3.select('#summary-post-svg');
	  	lineChart.selectAll('circle')
	  		.data(summaryData)
			.join('circle')
            .on('mouseover', function(event, d) { 
                that.tooltip.html(that.postsTooltipRender(d, that.subreddit))
                    .style('opacity', .9)
                    .style('left', (event.pageX) + 10 + 'px')
                    .style('top', (event.pageY) + 10 + 'px');
                }
            )
            .on('mouseout', function(d) {that.tooltip.style('opacity', 0)})
			.classed('summary-view-ts-posts-point', true)
			.transition()
			.duration(this.transitionDuration)
			.attr('r', 5)
			.attr('cx', d => this.timeScale(d.key))
			.attr('cy', d=> this.postScale(d.value))
			.attr('transform', 'translate(' + (this.xMargin) + ',0)');

		lineChart.select('#postLineChart')
			.join('svg:path')
			.datum(summaryData)
			.classed('summary-view-ts-path', true)
			.transition()
			.duration(this.transitionDuration)
			.attr("d", postLineGenerator)
			.attr('transform', 'translate(' + (this.xMargin) + ',0)');

		
	}

	drawTimeAxis() {
		this.svg.append('g')
			.attr('transform', 'translate(' + this.xMargin + ',' + (this.height - this.yMargin) + ')')
			.call(d3.axisBottom(this.timeScale))
			.attr('id', 'summary-post-x-axis');
	}

	drawPostAxis() {
		this.svg.append('g')
			.attr('transform', 'translate(' + (2 * this.xMargin) + ',0)')
			.call(d3.axisLeft(this.postScale))
			.attr('id', 'summary-post-y-axis');
	}

	// FYI: Used this as a reference:
	// https://stackoverflow.com/questions/39827055/d3-js-how-to-find-average-grouped-by-year-and-month
	// PJW
	groupByYearAndMonth(data) {
		return d3.nest()
			.key(d => +(new Date(d.TIMESTAMP.getFullYear(), d.TIMESTAMP.getMonth())))
			.rollup(function(v) {
				return d3.count(v, d => d.TIMESTAMP)
			})
			.entries(data);
	}

    postsTooltipRender(d, subreddit) {
    	let thisDate = new Date(+d.key);
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>Date:\t' + thisDate.toLocaleString('default', { month: 'long' }) + ' ' + thisDate.getFullYear() + '</p>';
        outputString += '<p>Links:\t' + d.value + '</p>';
        return outputString;
    }

}