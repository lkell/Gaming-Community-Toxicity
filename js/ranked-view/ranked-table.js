class RankedTable {
    constructor(redditData, updateSelectedSubreddit) {
        this.redditData = Object.entries(redditData)
        this.updateSelectedSubreddit = updateSelectedSubreddit;
        this.axisHeight = 20;
        this.densityWidth = 800;
        this.xMargin = 10;
        this.bandwidth = 0.05;
        this.resolution = 1000;
        this.vizHeight = 80;
        this.densityX = this.createDensityXScale()
        this.densityY = this.createDensityYScale()
        this.headerData = [
            {
                sorted: true,
                ascending: true,
                key: 'subreddit'
            },
            {
                sorted: false,
                ascending: true,
                key: 'links',
            },
            {
                sorted: false,
                ascending: true,
                key: 'density',
            },
            {
                sorted: false,
                ascending: true,
                key: 'positive',
            },
            {
                sorted: false,
                ascending: true,
                key: 'negative',
            },
            {
                sorted: false,
                ascending: true,
                key: 'compound',
            }
        ]
        this.colorMap =
            {'positive': '#FF8b60',
                'negative': '#9494FF',
                'compound':'#ffd635'};
        this.cleanData = this.redditData.map(d=>this.rowToCellDataTransform(d))
        this.drawTable();
        this.attachSortHandlers();
        this.attachSelectedHandler();
        this.mostLoving = this.getMostLoving();
        this.mostToxic = this.getMostToxic();
    };

    drawTable() {
        this.updateHeaders();
        this.drawLegend();

        let rowSelection = d3.select('#rankedTableBody')
            .selectAll('tr')
            .data(this.cleanData)
            .join('tr')
            .attr('id',d=>d.filter(d=>d.class==='subreddit')[0].value)

        let tableSelection = rowSelection.selectAll('td')
            .data(d=>d)
            .join('td')
            .attr("class",d=>d.class)
            .text(function (d){
                let returnVal = ""
                d.type === "text" ? returnVal = d.value : {};
                d.type === "sentiment-text" ? returnVal = d.value : {};
                return returnVal
            })
            .style('background-color',d=>d.backgroundColor);


        let vizSelection = tableSelection.filter(d => d.type === 'density');
        let svgSelect = vizSelection.selectAll('svg')
            .data(d => [d])
            .join('svg')
            .attr('width', this.densityWidth)
            .attr('height',this.vizHeight);

        let grouperSelect = svgSelect.selectAll('g')
            .data(d => [d])
            .join('g');

        this.addDensityPlots(grouperSelect);
    };


    rowToCellDataTransform(d) {
        let that = this;
        let subData = Object.entries(d[1])
        subData.pop()
        let CompoundAvg = subData.reduce((total, next) => total + next[1].CompoundSentiment, 0) / subData.length;
        let PosAvg = subData.reduce((total, next) => total + next[1].PositiveSentiment, 0) / subData.length;
        let NegAvg = subData.reduce((total, next) => total + next[1].NegativeSentiment, 0) / subData.length;
        let flatList = subData.map(function(d){return d[1]})
        let kdeTransform = function(data)  {
            let kde = kernelDensityEstimator(eKernel(that.bandwidth), that.densityX.ticks(that.resolution));
            return kde(data);
        }
        let subreddit = {
            type: 'text',
            class: 'subreddit',
            backgroundColor:'transparent',
            value: d[0]
        };
        let links = {
            type: 'text',
            class: 'links',
            backgroundColor: 'transparent',
            value: subData.length
        };
        let densityData = {
            type: 'density',
            class: 'density',
            backgroundColor: 'transparent',
            positive: kdeTransform(flatList.map(d=>d.PositiveSentiment)),
            negative: kdeTransform(flatList.map(d=>d.NegativeSentiment)),
            compound: kdeTransform(flatList.map(d=>d.CompoundSentiment))
        };
        let positiveData = {
            type: 'sentiment-text',
            class: 'positive',
            backgroundColor: 'rgb(255, 139, 96, '+PosAvg.toFixed(2)+')',
            value: PosAvg.toFixed(2)
        };
        let negativeData = {
            type: 'sentiment-text',
            class: 'negative',
            backgroundColor: 'rgb(148, 148, 255, '+NegAvg.toFixed(2)+')',
            value: NegAvg.toFixed(2)
        };
        let compoundData = {
            type: 'sentiment-text',
            class: 'compound',
            backgroundColor:'rgb(255, 214, 53, '+CompoundAvg.toFixed(2)+')',
            value: CompoundAvg.toFixed(2)
        };
        return  [subreddit, links, densityData, positiveData, negativeData, compoundData];
    };


    drawLegend() {
        let densityLabels = ["-1.0","-0.5","0.0","0.5","1.0"]
        var density_axis = d3.axisBottom(this.densityX)
            .tickValues([-1,-.5,0,.5,1])
            .tickFormat((d,i) => densityLabels[i]);

        d3.select('#densityAxis')
            .attr('height', this.axisHeight)
            .attr('width', this.densityWidth)
            .join("g")
            .call(density_axis)
            .call(densitySelection => densitySelection.select(".domain").remove())
            .call(densitySelection => densitySelection.selectAll('g').selectAll("line").attr("y1",14).attr("y2",32))
            .call(densitySelection => densitySelection.selectAll('g').selectAll("text").attr("y",3))
    };

    addDensityPlots(containerSelect){
        let that = this;
        containerSelect
            .join("path")
            .append("path")
            .datum(d=>d.compound)
            .attr("fill", this.colorMap['compound'])
            .attr("opacity", ".5")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(d=>that.densityX(d['x']))
                .y(d=>(-1*that.densityY(d['y']))+this.vizHeight)
            )
        containerSelect
            .join("path")
            .append("path")
            .datum(d=>d.positive)
            .attr("fill", this.colorMap['positive'])
            .attr("opacity", ".5")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(d=>that.densityX(d['x']))
                .y(d=>(-1*that.densityY(d['y']))+this.vizHeight)
            );
        containerSelect
            .join("path")
            .append("path")
            .datum(d=>d.negative)
            .attr("fill", this.colorMap['negative'])
            .attr("opacity", ".5")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(d=>that.densityX(d['x']))
                .y(d=>(-1*that.densityY(d['y']))+this.vizHeight)
            );

    };

    createDensityXScale() {
        return d3.scaleLinear()
            .domain([-1.1, 1.1])
            .range([this.xMargin, this.densityWidth]);
    };

    createDensityYScale() {
        return d3.scaleLinear()
            .domain([-0.1,15])
            .range([0, this.vizHeight])
        };

    updateHeaders() {
        let columnHeaderSelections = d3.select("#columnHeaders").selectAll("th")
        columnHeaderSelections.data(this.headerData)
            .join("th")
            .attr("id", d => d.key)
            .attr("class", function (d){
                if (d.sorted){
                    return "sortable sorting"
                }
                else {
                    return "sortable"
                }
            })
        columnHeaderSelections.select("i").data(this.headerData)
            .join("i")
            .attr("class", function (d){
                if (!d.sorted){
                    "far no-display"
                }
                else if (d.ascending){
                    return "fas fa-sort-down"
                }
                else {
                    return "fas fa-sort-up"
                }
            })
    };

    attachSortHandlers()
    {
        let columnHeaderSelections = d3.select("#columnHeaders").selectAll("th")
        columnHeaderSelections.data(this.headerData)
            .join("th")
            .attr("id", d => d.key)
        let that = this
        columnHeaderSelections.on("click",function() {
            let curId = this.id
            that.headerData.forEach(function (d){
                if (d.key !== curId){
                    d.sorted = false;
                    d.ascending = true;
                }
            })
            let toSort = that.headerData.filter(d => d.key === curId)[0];
            let ascending = !toSort.ascending;
            curId === 'density' ? curId = 'compound': {}
            that.cleanData = that.cleanData.sort(function(x,y){
                if (ascending) {
                    return d3.ascending(x.filter(d=>d.class===curId)[0].value*1, y.filter(d=>d.class===curId)[0].value*1)
                }
                else {
                    return d3.descending(x.filter(d=>d.class===curId)[0].value*1, y.filter(d=>d.class===curId)[0].value*1)
                }
            })
            toSort.sorted = true;
            toSort.ascending = ascending;
            that.drawTable()
        })
    };

    attachSelectedHandler(){
        let that = this;
        let rowSelections = d3.select("#rankedTableBody").selectAll("tr")
        rowSelections.on("click", function(){
            that.updateSelectedSubreddit(this.id)
        })
    };

    getMostLoving(){
        let that = this;
        let descendingData = that.cleanData.sort(function(x,y){
                return d3.descending(x.filter(d=>d.class==='compound')[0].value, y.filter(d=>d.class==='compound')[0].value)
        })
        return descendingData[0][0].value
    };

    getMostToxic(){
        let that = this;
        let descendingData = that.cleanData.sort(function(x,y){
            return d3.descending(x.filter(d=>d.class==='compound')[0].value, y.filter(d=>d.class==='compound')[0].value)
        })
        return descendingData[descendingData.length-1][0].value
    };

}
