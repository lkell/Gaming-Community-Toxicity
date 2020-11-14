class PostsLineChart {

	constructor(data) {
        this.subreddit = 'SELECT SUBREDDIT';
		this.data = data;
		this.xMargin = 20;
		this.yMargin = 10;
		this.width = 575;
		this.height = 300;
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
	}

	// TODO: Figure out why dateMin is is off by ~1 month PJW
	createTimeScale() {
		let tsArray = flattenValues(this.data, 'TIMESTAMP');
		let dateMin = d3.min(tsArray);
		let dateMax = d3.max(tsArray);
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
	  
		lineChart.append('svg:path')
			.attr('id', 'postLineChart')
			.datum(summaryData)
			.attr("d", postLineGenerator)
			.classed('summary-view-ts-path', true)
			.attr('transform', 'translate(' + (this.xMargin) + ',0)');

		lineChart.selectAll('circle')
			.data(summaryData)
			.join('circle')
            .on('mouseover', function(d) { 
                that.tooltip.html(that.postsTooltipRender(d, that.subreddit))
                    .style('opacity', .9)
                    .style('left', (d3.event.pageX) + 10 + 'px')
                    .style('top', (d3.event.pageY) + 10 + 'px');
                }
            )
            .on('mouseout', function(d) {that.tooltip.style('opacity', 0)})
			.attr('r', 5)
			.attr('cx', d => this.timeScale(d.key))
			.attr('cy', d=> this.postScale(d.value))
			.classed('summary-view-ts-posts-point', true)
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
        outputString += '<p>Posts:\t' + d.value + '</p>';
        return outputString;
    }

}