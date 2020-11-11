class PostsLineChart {

	constructor(data) {
		this.data = data;
		this.xMargin = 20;
		this.yMargin = 10;
		this.width = 500;
		this.height = 300;
		this.svg = d3.select('#summary-view-post-card')
	        .append('svg')
	        .attr('width', this.width + 2 * this.xMargin)
	        .attr('height', this.height + 2 * this.yMargin)
	        .attr('id', 'summary-post-svg');
    	this.timeScale = this.createTimeScale();
    	this.postScale = this.createPostScale();
	}

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
		let summaryData = objectToArray(this.data[sourceSubreddit]);

		summaryData = this.groupByYearAndMonth(summaryData);

		this.drawTimeAxis();
		this.drawPostAxis();

		let postLineGenerator = d3.line()
			.x(d => this.timeScale(d.key))
			// TODO: Change once cum sum is figured out PJW
			.y(d => this.postScale(d.value));

		let lineChart = d3.select('#summary-post-svg');
	  
		lineChart.append('svg:path')
			.attr('id', 'postLineChart')
			.datum(summaryData)
			.transition()
			.duration(1000)
			.attr("d", postLineGenerator)
			.attr('fill', 'none')
			.attr('stroke', 'black')
			.attr('stroke-width', 1.5)
			.attr('transform', 'translate(' + (this.xMargin * 1.75) + ',0)');
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

}