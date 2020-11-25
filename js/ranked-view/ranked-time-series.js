
class RankedTimeSeries {
    constructor(redditData) {
        this.redditData = Object.entries(redditData);
        this.statsTimeSeries = this.calcStats()
        this.statsMinMax = this.getMinMax()
        this.xMargin = 15;
        this.yMargin = 10;
        this.width = 545;
        this.height = 300;
        this.sentiments = ['positive','negative','compound']
        this.colorMap = {'positive': '#FF8b60',
                         'negative': '#9494FF',
                         'compound':'#ffd635'};
    }

    drawTimeSeries(){
        let that = this;
        this.sentiments.forEach(function(d){
            let svg = d3.select('#ranked-timeseries-'+d)
                .append('svg')
                .attr('width', that.width)
                .attr('height', that.height)
                .attr('id', 'ranked-ts-svg-'+d)
            let dateRange = that.statsTimeSeries[d].map(d=>d['key'])
            var xAxis = d3.scaleTime()
                .domain(d3.extent(dateRange))
                .range([3*that.xMargin, that.width-2*that.xMargin]);

            var yAxis = d3.scaleLinear()
                .domain(that.statsMinMax)
                .range([that.height-2*that.yMargin, 2*that.yMargin]);

            svg.append("g")
                .attr("transform", "translate(0," +(that.height-2*that.yMargin)+ ")")
                .call(d3.axisBottom(xAxis).tickSize(0).ticks(3))
                .call(g => g.select(".domain").remove());

            svg.append("g")
                .attr("transform", "translate("+2*that.xMargin+",0)")
                .call(d3.axisLeft(yAxis).tickSize(0).ticks(5))
                .call(g => g.select(".domain").remove());

            console.log(that.statsTimeSeries)
            svg.append("path")
                .datum(that.statsTimeSeries[d])
                .attr("fill", "none")
                .attr("stroke", that.colorMap[d])
                .attr("stroke-width", 1)
                .attr("d", d3.line().x(function(d) {return xAxis(d.key)})
                    .y(function(d) {return yAxis(d.value)})
                )
        })
    };


    calcStats(){
        let flatLinks = this.redditData.map(d=>Object.entries(d[1]).map(e=>e[1])).flat()
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
        let min = 0;
        let max = 0.4;

        return [min,max]
    }

}