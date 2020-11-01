class PostsLineChart {

	constructor(data) {
		this.data = data;
		this.xMargin = 40;
		this.yMargin = 20;
		this.width = 500;
		this.height = 300;
		this.svg = d3.select('#summary-view-container')
	        .append('svg')
	        .attr('width', this.width)
	        .attr('height', this.height)
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
			.range([0, this.width - this.xMargin]);
	}

	createPostScale() {
		let postArray = flattenValues(this.data, 'TIMESTAMP');
		let postMin = 0;
		let postMax = postArray.length
		return d3.scaleLinear()
			.domain([postMin, postMax])
			.range([this.height - this.yMargin, 0]);
	}

	draw(sourceSubreddit) {
		let summaryData = this.data[sourceSubreddit];

		// TODO: Get cumulative sum of posts, or count by year PJW
		console.log(summaryData)

		this.drawTimeScale();
		this.drawPostScale();

		let postLineGenerator = d3.line()
			.x(d => this.timeScale(d.TIMESTAMP))
			// TODO: Change once cum sum is figured out PJW
			.y(d => this.postScale(1));

		let lineChart = d3.select('#summary-post-svg');
	  
		lineChart.select("#postLineChart")
			.datum(this.data)
			.transition()
			.duration(1000)
			.attr("d", postLineGenerator)
	}

	drawTimeScale() {
		this.svg.append('g')
			.attr('transform', 'translate(' + this.xMargin + ',' + (this.height - this.yMargin) + ')')
			.call(d3.axisBottom(this.timeScale))
			.attr('id', 'summary-post-x-axis');
	}

	drawPostScale() {
		this.svg.append('g')
			.attr('transform', 'translate(' + this.xMargin + ', 0)')
			.call(d3.axisLeft(this.postScale))
			.attr('id', 'summary-post-y-axis');
	}

}