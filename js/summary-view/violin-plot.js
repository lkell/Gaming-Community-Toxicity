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
		this.svg = d3.select('#summary-view-container')
	        .append('svg')
	        .attr('width', this.width)
	        .attr('height', this.height)
	        .attr('id', 'summary-violin-plot-svg');
        this.sentimentScale = this.createSentimentScale();
        this.distScale = this.createSubredditScale();
	}

	draw(subreddit) {
		console.log(this);
	}
	
}