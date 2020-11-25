
class RankedTimeSeries {
    constructor(redditData) {
        this.redditData = Object.entries(redditData);
        this.statsTimeSeries = this.calcStats()
        this.statsMinMax = this.getMinMax()
        this.xMargin = 15;
        this.yMargin = 10;
        this.width = 1735;
        this.height = 300;
        this.colorMap =
            {0: '#FF8b60', 1: '#9494FF', 2:'#ffd635'};
    }

    drawTimeSeries(){
        let svg = d3.select('#ranked-timeseries')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('id', 'ranked-ts-svg')
        let dateRange = this.statsTimeSeries[0].map(d=>d['key'])
        var xAxis = d3.scaleTime()
            .domain(d3.extent(dateRange))
            .range([3*this.xMargin, this.width-2*this.xMargin]);

        var yAxis = d3.scaleLinear()
            .domain(this.statsMinMax)
            .range([this.height-2*this.yMargin, 2*this.yMargin]);

        svg.append("g")
            .attr("transform", "translate(0," +(this.height-2*this.yMargin)+ ")")
            .call(d3.axisBottom(xAxis).tickSize(0))
            .call(g => g.select(".domain").remove());

        svg.append("g")
            .attr("transform", "translate("+2*this.xMargin+",0)")
            .call(d3.axisLeft(yAxis).tickSize(0).ticks(5))
            .call(g => g.select(".domain").remove());


        let that = this;
        this.statsTimeSeries.forEach(function(stats,i){
                svg.append("path")
                    .datum(stats)
                    .attr("fill", "none")
                    .attr("stroke", that.colorMap[i])
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
        return [positiveAverage, negativeAverage, compoundAverage]
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