class RankedTable {
    constructor(redditData) {
        this.redditData = Object.entries(redditData);

        this.axisHeight = 20;
        this.densityWidth = 500;

        this.headerData = [
            {
                sorted: false,
                ascending: false,
                key: 'subreddit'
            },
            {
                sorted: false,
                ascending: false,
                key: 'density',
            },
            {
                sorted: false,
                ascending: false,
                key: 'positive',
            },
            {
                sorted: false,
                ascending: false,
                key: 'negative',
            },
            {
                sorted: false,
                ascending: false,
                key: 'compound',
            }
        ]

        this.densityX = d3.scaleLinear()
            .domain([-0.1, 1.1])
            .range([0, this.densityWidth]);

        this.drawTable();
        // this.attachSortHandlers();
        this.drawLegend();
    }

    drawTable() {
        let rowSelection = d3.select('#rankedTableBody')
            .selectAll('tr')
            .data(this.redditData)
            .join('tr');

        // Fill in text columns
        let tableSelection = rowSelection.selectAll('td')
            .data(this.rowToCellDataTransform)
            .join('td')
            .attr("class",d=>d.class)
            .text(function (d){
                let returnVal = ""
                d.type === "text" ? returnVal = d.value : {};
                return returnVal
            })
    }


    rowToCellDataTransform(d) {
        let subData = Object.entries(d[1])
        subData.pop()
        let CompoundAvg = subData.reduce((total, next) => total + next[1].CompoundSentiment, 0) / subData.length;
        let PosAvg = subData.reduce((total, next) => total + next[1].PositiveSentiment, 0) / subData.length;
        let NegAvg = subData.reduce((total, next) => total + next[1].NegativeSentiment, 0) / subData.length;

        let subreddit = {
            type: 'text',
            class: 'subreddit',
            value: d[0]
        };
        let densityData = {
            type: 'densityViz',
            class: 'density',
        };
        let positiveData = {
            type: 'text',
            class: 'positive',
            value: PosAvg.toFixed(2)
        };
        let negativeData = {
            type: 'text',
            class: 'negative',
            value: NegAvg.toFixed(2)
        };
        let compoundData = {
            type: 'text',
            class: 'compound',
            value: CompoundAvg.toFixed(2)
        };
        return  [subreddit, densityData, positiveData, negativeData, compoundData];
    }

    drawLegend() {
        //Draw Density Legend
        let densityLabels = ["0.0","0.5","1.0"]
        var density_axis = d3.axisBottom(this.densityX)
            .tickValues([0,.5,1])
            .tickFormat((d,i) => densityLabels[i]);

        let densitySelection = d3.select('#densityAxis')
            .attr('height', this.axisHeight)
            .attr('width', this.densityWidth)
            .join("g")
            .call(density_axis)
            .call(densitySelection => densitySelection.select(".domain").remove())
            .call(densitySelection => densitySelection.selectAll('g').selectAll("line").attr("y1",14).attr("y2",32))
            .call(densitySelection => densitySelection.selectAll('g').selectAll("text").attr("y",3))
    }


}
