
class RankedTimeSeries {
    constructor(redditData) {
        this.redditData = Object.entries(redditData);
        this.statsTimeSeries = this.calcStats('all')
        this.statsMinMax = this.getMinMax()
        this.xMargin = 15;
        this.yMargin = 10;
        this.width = 545;
        this.height = 300;
        this.sentiments = ['positive','negative','compound']
        this.colorMap = {'positive': '#FF8b60',
                         'negative': '#9494FF',
                         'compound':'#ffd635'};
        this.drawTimeSeries()
    }

    drawTimeSeries(){
        let that = this;
        this.sentiments.forEach(function(s){
            let svg = d3.select('#ranked-timeseries-'+s)
                .append('svg')
                .attr('width', that.width)
                .attr('height', that.height)
                .attr('id', 'ranked-ts-svg-'+s)

            svg.append('text')
                .attr("x", 40)
                .attr("y", 25)
                .style("font-size", 15)
                .attr("text-decoration", "underline")
                .text("Overall Average "+ s.charAt(0).toUpperCase() + s.slice(1)+" Sentiment");

            let dateRange = that.statsTimeSeries[s].map(d=>d['key'])
            var xAxis = d3.scaleTime()
                .domain(d3.extent(dateRange))
                .range([3*that.xMargin, that.width-2*that.xMargin]);

            var yAxis = d3.scaleLinear()
                .domain(that.statsMinMax)
                .range([that.height-2*that.yMargin, 2*that.yMargin]);
            let grouperSelect = svg.selectAll('g')
                .data(() => ['', '',''])
                .join('g');

            that.addXAxis(grouperSelect.filter((d,i) => i === 0), xAxis, that.height, that.yMargin);
            that.addYAxis(grouperSelect.filter((d,i) => i === 1), yAxis, that.xMargin);

            grouperSelect.filter((d,i) => i === 2)
                .join("path")
                .append("path")
                .datum(that.statsTimeSeries[s])
                .attr("fill", 'none')
                .attr("stroke", that.colorMap[s])
                .attr("stroke-width", 1)
                .attr("d", d3.line().x(function(d) {return xAxis(d.key)})
                    .y(function(d) {return yAxis(d.value)})
                );

        })
    };

    addXAxis(containerSelect, xAxis, height, yMargin){
        containerSelect.join("g")
            .append("g")
            .attr("transform", "translate(0," +(height-2*yMargin)+ ")")
            .call(d3.axisBottom(xAxis).tickSize(0).ticks(3))
            .call(g => g.select(".domain").remove());

    }

    addYAxis(containerSelect, yAxis, xMargin){
        containerSelect.join("g")
            .append("g")
            .attr("transform", "translate("+2*xMargin+",0)")
            .call(d3.axisLeft(yAxis).tickSize(0).ticks(5))
            .call(g => g.select(".domain").remove());

    }


    calcStats(selected){
        let plotData = this.redditData;
        if (selected !== 'all'){
            plotData = plotData.filter(d=>d[0]===selected)
        }
        let flatLinks = plotData.map(d=>Object.entries(d[1]).map(e=>e[1])).flat()
        let positiveAverage = this.calcAverage(flatLinks, 'PositiveSentiment')
        let negativeAverage = this.calcAverage(flatLinks, 'NegativeSentiment')
        let compoundAverage = this.calcAverage(flatLinks, 'CompoundSentiment')
        return {'positive':positiveAverage, 'negative':negativeAverage, 'compound':compoundAverage}
        };

    calcAverage(flatLinks, key){
        let average =  d3.nest()
            .key(d => +(new Date(d.TIMESTAMP.getFullYear(), d.TIMESTAMP.getMonth())))
            .rollup(function(v) {
                return d3.mean(v.map(link=>link[key]))
            }).entries(flatLinks);
        return average.sort(function(x, y){
            return d3.ascending(x.key, y.key);
        })
    }

    getMinMax(){
        let min = -0.2;
        let max = 0.4;
        return [min,max]
    }

}