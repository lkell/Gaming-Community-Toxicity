// FYI: Used this as a reference:
// https://github.com/asielen/D3_Reusable_Charts/blob/master/distro_chart/distrochart.js
// PJW

class SentimentBreakout {
	
	constructor(data) {
		this.data = data;
		this.xMargin = 20;
		this.yMargin = 10;
		this.width = 450;
		this.height = 300;
		this.svg = d3.select('#summary-view-sentiment-card')
	        .append('svg')
	        .attr('width', this.width + 2 * this.xMargin)
	        .attr('height', this.height + 2 * this.yMargin)
	        .attr('id', 'summary-bar-sentiment-svg');
    	let emotionLabels = [
    		'Posemo',
    		'Negemo',
    		'Anx',
    		'Anger',
    		'Sad',
    		'Assent',
    		'Dissent',
    	];
    	this.emotionArray = [];
    	emotionLabels.forEach(label => this.emotionArray.push('LIWC_' + label));
    	this.bandScale = this.createBandScale();
    	this.sentimentScale = this.createSentimentScale();
	}

	createBandScale() {
		return d3.scaleBand()
			.domain(this.emotionArray)
			.range([this.xMargin, this.width - this.xMargin]);
	}

	createSentimentScale() {
		return d3.scaleLinear()
			.domain([0, 0.2])
			.range([this.height, this.yMargin]);

	}

	draw(sourceSubreddit) {
		let summaryData = objectToArray(this.data[sourceSubreddit]);
		summaryData = this.groupSummaryDataBySentimentScores(summaryData);
		summaryData = this.prepareData(summaryData);

		this.drawBandAxis();
		this.drawSentimentAxis();
		this.prepareBoxPlot(summaryData);
		this.renderBoxPlot(summaryData);
	}

	groupSummaryDataBySentimentScores(summaryData) {
		let reformattedData = {};
		this.emotionArray.forEach(label => reformattedData[label] = {'values':[]});
		for (let row of summaryData) {
			for (let label of this.emotionArray) {
				reformattedData[label]['values'].push(row[label]);
			}
		}
		return reformattedData;
	}

	prepareData(summaryData) {
        for (let label in summaryData) {
            summaryData[label].values.sort(d3.ascending);
            summaryData[label].metrics = {};
            summaryData[label].metrics = calcMetrics(summaryData[label].values);
        }
        return summaryData;
    }

	drawBandAxis() {
		this.svg.append('g')
			.attr('transform', 'translate(0' + this.xMargin + ',' + this.height + ')')
			.call(d3.axisBottom(this.bandScale))
			.attr('id', 'summary-sentiment-x-axis');
	}

	drawSentimentAxis() {
		this.svg.append('g')
			.attr('transform', 'translate(' + (2 * this.xMargin) + ',0)')
			.call(d3.axisLeft(this.sentimentScale))
			.attr('id', 'summary-sentiment-y-axis');
	}

	/**
     * Create the svg elements for the box plot
     */

    getObjWidth(objWidth, gName) {
		    var objSize = {left: null, right: null, middle: null};
		    var width = this.bandScale.bandwidth() * (objWidth / 100);
		    var padding = (this.bandScale.bandwidth() - width) / 2;
		    var gShift = this.bandScale(gName);
		    objSize.middle = this.bandScale.bandwidth() / 2 + gShift;
		    objSize.left = padding + gShift;
		    objSize.right = objSize.left + width;
		    return objSize;
	}

    prepareBoxPlot(summaryData) {
    	let boxPlots = {};
        let that = this;

        // Defaults
        let defaultOptions = {
            show: true,
            showBox: true,
            showWhiskers: true,
            showMedian: true,
            showMean: false,
            medianCSize: 3.5,
            showOutliers: true,
            boxWidth: 30,
            lineWidth: null,
            scatterOutliers: false,
            outlierCSize: 2.5,
            // colors: chart.colorFunct
        };
        boxPlots.options = defaultOptions;
        let bOpts = boxPlots.options;

        //Create box plot objects
        for (let label in summaryData) {
            summaryData[label].boxPlot = {};
            summaryData[label].boxPlot.objs = {};
        }

        /**
         * Calculates all the outlier points for each group
         */
        !function calcAllOutliers() {

            /**
             * Create lists of the outliers for each content group
             * @param cGroup The object to modify
             * @return null Modifies the object in place
             */
            function calcOutliers(cGroup) {
                let cExtremes = [];
                let cOutliers = [];
                let cOut, idx;
                for (idx = 0; idx <= cGroup.values.length; idx++) {
                    cOut = {value: cGroup.values[idx]};

                    if (cOut.value < cGroup.metrics.lowerInnerFence) {
                        if (cOut.value < cGroup.metrics.lowerOuterFence) {
                            cExtremes.push(cOut);
                        } else {
                            cOutliers.push(cOut);
                        }
                    } else if (cOut.value > cGroup.metrics.upperInnerFence) {
                        if (cOut.value > cGroup.metrics.upperOuterFence) {
                            cExtremes.push(cOut);
                        } else {
                            cOutliers.push(cOut);
                        }
                    }
                }
                cGroup.boxPlot.objs.outliers = cOutliers;
                cGroup.boxPlot.objs.extremes = cExtremes;
            }

            for (let label in summaryData) {
                calcOutliers(summaryData[label]);
            }
        }();

        let label, cBoxPlot;

        for (label in summaryData) {
            cBoxPlot = summaryData[label].boxPlot;

            cBoxPlot.objs.g = that.svg.append("g").attr("class", "box-plot");

            //Plot Box (default show)
            // if (bOpts.showBox) {
            cBoxPlot.objs.box = cBoxPlot.objs.g.append("rect")
                .attr("class", "box")
                .attr('fill', 'none')
                .attr('stroke', 'black')
                    // .style("fill", boxPlots.colorFunct(label))
                    // .style("stroke", boxPlots.colorFunct(label));
                //A stroke is added to the box with the group color, it is
                // hidden by default and can be shown through css with stroke-width
            // }

            //Plot Median (default show)
            // if (bOpts.showMedian) {
            cBoxPlot.objs.median = {line: null, circle: null};
            cBoxPlot.objs.median.line = cBoxPlot.objs.g.append("line")
                .attr("class", "median");
            cBoxPlot.objs.median.circle = cBoxPlot.objs.g.append("circle")
                .attr("class", "median")
                .attr('r', bOpts.medianCSize)
                .style('fill', 'red')
                // .style("fill", boxPlots.colorFunct(label));
            // }

            // Plot Mean (default no plot)
            // if (bOpts.showMean) {
            //     cBoxPlot.objs.mean = {line: null, circle: null};
            //     cBoxPlot.objs.mean.line = cBoxPlot.objs.g.append("line")
            //         .attr("class", "mean");
            //     cBoxPlot.objs.mean.circle = cBoxPlot.objs.g.append("circle")
            //         .attr("class", "mean")
            //         .attr('r', bOpts.medianCSize)
            //         // .style("fill", boxPlots.colorFunct(label));
            // }

            // Plot Whiskers (default show)
            if (bOpts.showWhiskers) {
                cBoxPlot.objs.upperWhisker = {fence: null, line: null};
                cBoxPlot.objs.lowerWhisker = {fence: null, line: null};
                cBoxPlot.objs.upperWhisker.fence = cBoxPlot.objs.g.append("line")
                    .attr("class", "upper whisker")
                    .style('stroke', 'black')
                    // .style("stroke", boxPlots.colorFunct(label));
                cBoxPlot.objs.upperWhisker.line = cBoxPlot.objs.g.append("line")
                    .attr("class", "upper whisker")
                    // .style("stroke", boxPlots.colorFunct(label));

                cBoxPlot.objs.lowerWhisker.fence = cBoxPlot.objs.g.append("line")
                    .attr("class", "lower whisker")
                    // .style("stroke", boxPlots.colorFunct(label));
                cBoxPlot.objs.lowerWhisker.line = cBoxPlot.objs.g.append("line")
                    .attr("class", "lower whisker")
                    // .style("stroke", boxPlots.colorFunct(label));
            }

            // Plot outliers (default show)
            // if (bOpts.showOutliers) {
            //     if (!cBoxPlot.objs.outliers) calcAllOutliers();
            let pt;
            if (cBoxPlot.objs.outliers.length) {
                let outDiv = cBoxPlot.objs.g.append("g").attr("class", "boxplot outliers");
                for (pt in cBoxPlot.objs.outliers) {
                    cBoxPlot.objs.outliers[pt].point = outDiv.append("circle")
                        .attr("class", "outlier")
                        .attr('r', bOpts.outlierCSize)
                        // .style("fill", boxPlots.colorFunct(label));
                }
            }

            if (cBoxPlot.objs.extremes.length) {
                let extDiv = cBoxPlot.objs.g.append("g").attr("class", "boxplot extremes");
                for (pt in cBoxPlot.objs.extremes) {
                    cBoxPlot.objs.extremes[pt].point = extDiv.append("circle")
                        .attr("class", "extreme")
                        .attr('r', bOpts.outlierCSize)
                        // .style("stroke", boxPlots.colorFunct(label));
                }
            }
            // }
        }
        return summaryData
	};

	renderBoxPlot(summaryData) {
        
        /**
         * Update the box plot obj values
         */
        
        let label, cBoxPlot;
        let boxPlots = {};
        let that = this;

        // Defaults
        let defaultOptions = {
            show: true,
            showBox: true,
            showWhiskers: true,
            showMedian: true,
            showMean: false,
            medianCSize: 3.5,
            showOutliers: true,
            boxWidth: 30,
            lineWidth: null,
            scatterOutliers: false,
            outlierCSize: 2.5,
            // colors: chart.colorFunct
        };
        boxPlots.options = defaultOptions;
        let bOpts = boxPlots.options;

        for (label in summaryData) {
            cBoxPlot = summaryData[label].boxPlot;

            // Get the box width
            let objBounds = this.getObjWidth(bOpts.boxWidth, label);
            let width = (objBounds.right - objBounds.left);

            let sMetrics = {}; //temp let for scaled (plottable) metric values
            for (let attr in summaryData[label].metrics) {
                sMetrics[attr] = null;
                sMetrics[attr] = this.sentimentScale(summaryData[label].metrics[attr]);
            }

            // Box
            // if (cBoxPlot.objs.box) {
            cBoxPlot.objs.box
                .attr("x", objBounds.left)
                .attr('width', width)
                .attr("y", sMetrics.quartile3)
                .attr("rx", 1)
                .attr("ry", 1)
                .attr("height", -sMetrics.quartile3 + sMetrics.quartile1)
            // }

            // Lines
            let lineBounds = null;
            if (bOpts.lineWidth) {
                lineBounds = this.getObjWidth(bOpts.lineWidth, label)
            } else {
                lineBounds = objBounds
            }
            // --Whiskers
            if (cBoxPlot.objs.upperWhisker) {
                cBoxPlot.objs.upperWhisker.fence
                    .attr("x1", lineBounds.left)
                    .attr("x2", lineBounds.right)
                    .attr('y1', sMetrics.upperInnerFence)
                    .attr("y2", sMetrics.upperInnerFence);
                cBoxPlot.objs.upperWhisker.line
                    .attr("x1", lineBounds.middle)
                    .attr("x2", lineBounds.middle)
                    .attr('y1', sMetrics.quartile3)
                    .attr("y2", sMetrics.upperInnerFence);

                cBoxPlot.objs.lowerWhisker.fence
                    .attr("x1", lineBounds.left)
                    .attr("x2", lineBounds.right)
                    .attr('y1', sMetrics.lowerInnerFence)
                    .attr("y2", sMetrics.lowerInnerFence);
                cBoxPlot.objs.lowerWhisker.line
                    .attr("x1", lineBounds.middle)
                    .attr("x2", lineBounds.middle)
                    .attr('y1', sMetrics.quartile1)
                    .attr("y2", sMetrics.lowerInnerFence);
            }

            // --Median
            // if (cBoxPlot.objs.median) {
            cBoxPlot.objs.median.line
                .attr("x1", lineBounds.left)
                .attr("x2", lineBounds.right)
                .attr('y1', sMetrics.median)
                .attr("y2", sMetrics.median);
            cBoxPlot.objs.median.circle
                .attr("cx", lineBounds.middle)
                .attr("cy", sMetrics.median)
            // }

            // --Mean
            // if (cBoxPlot.objs.mean) {
            //     cBoxPlot.objs.mean.line
            //         .attr("x1", lineBounds.left)
            //         .attr("x2", lineBounds.right)
            //         .attr('y1', sMetrics.mean)
            //         .attr("y2", sMetrics.mean);
            //     cBoxPlot.objs.mean.circle
            //         .attr("cx", lineBounds.middle)
            //         .attr("cy", sMetrics.mean);
            // }

            // Outliers
            let pt;
            if (cBoxPlot.objs.outliers) {
                for (pt in cBoxPlot.objs.outliers) {
                    // cBoxPlot.objs.outliers[pt].append('circle')
                    this.svg.append('circle')
                        .attr("cx", objBounds.middle)
                        .attr("cy", this.sentimentScale(cBoxPlot.objs.outliers[pt].value));
                }
            }
            if (cBoxPlot.objs.extremes) {
                for (pt in cBoxPlot.objs.extremes) {
                	this.svg.append('circle')
                    // cBoxPlot.objs.extremes[pt].append('circle')
                        .attr("cx", objBounds.middle)
                        .attr("cy", this.sentimentScale(cBoxPlot.objs.extremes[pt].value));
                }
            }
        }
        
    };

}