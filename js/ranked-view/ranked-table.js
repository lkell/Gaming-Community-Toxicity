class RankedTable {
    constructor(redditData) {
        this.redditData = Object.entries(redditData);

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
                sorted: false,
                ascending: false,
                key: 'subreddit'
            },
            {
                sorted: false,
                ascending: false,
                key: 'links',
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
        this.colorMap =
            {'positive': '#FF8b60',
                'negative': '#9494FF',
                'compound':'#ffd635'};
        this.drawTable();
    }

    drawTable() {
        this.drawLegend();
        let rowSelection = d3.select('#rankedTableBody')
            .selectAll('tr')
            .data(this.redditData)
            .join('tr');
        rowSelection.on('click', () =>
        {
            console.log('clicked')
        });

        let tableSelection = rowSelection.selectAll('td')
            .data(this.rowToCellDataTransform)
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
    }


    rowToCellDataTransform(d) {
        let subData = Object.entries(d[1])
        subData.pop()
        let CompoundAvg = subData.reduce((total, next) => total + next[1].CompoundSentiment, 0) / subData.length;
        let PosAvg = subData.reduce((total, next) => total + next[1].PositiveSentiment, 0) / subData.length;
        let NegAvg = subData.reduce((total, next) => total + next[1].NegativeSentiment, 0) / subData.length;
        let flatList = subData.map(function(d){return d[1]})
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
            positive: flatList.map(d=>d.PositiveSentiment),
            negative: flatList.map(d=>d.NegativeSentiment),
            compound: flatList.map(d=>d.CompoundSentiment)
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
    }

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
    }

    addDensityPlots(containerSelect){
        let that = this;
        let kdeTransform = function(data)  {
            let kde = kernelDensityEstimator(eKernel(that.bandwidth), that.densityX.ticks(that.resolution));
            return kde(data);
        }

        containerSelect
            .join("path")
            .append("path")
            .datum(d=>kdeTransform(d.compound))
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
            .datum(d=>kdeTransform(d.positive))
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
            .datum(d=>kdeTransform(d.negative))
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

    }

    createDensityXScale() {
        return d3.scaleLinear()
            .domain([-1.1, 1.1])
            .range([this.xMargin, this.densityWidth]);
    }

    createDensityYScale() {
        return d3.scaleLinear()
            .domain([-0.1,15])
            .range([0, this.vizHeight])
        };

}
