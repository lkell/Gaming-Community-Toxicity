let globalData;

loadData().then(data => {
    d3.selectAll(".load-notifier").classed("hidden", true)

    Object.keys(data).forEach(function(subreddit) {
            Object.keys(data[subreddit]).forEach(function(postId) {
                Object.keys(data[subreddit][postId]).forEach(function(column) {
                    if ((column != 'TIMESTAMP') && (column != 'TARGET_SUBREDDIT')) {
                        data[subreddit][postId][column] = +data[subreddit][postId][column]
                    }
                })
                data[subreddit][postId]['TIMESTAMP'] = new Date(data[subreddit][postId]['TIMESTAMP'])
            })
        });

    console.log(data)
    addNavigation();
    globalData = data;

//   Summary View
    readabilityViolinPlot = new ReadabilityViolinPlot(data);
    postsLineChart = new PostsLineChart(data);
    violinPlot = new ViolinPlot(data);  
    let defaultSubreddit = 'leagueoflegends';
  
    violinPlot.draw(defaultSubreddit);
    postsLineChart.draw(defaultSubreddit);
    readabilityViolinPlot.draw(defaultSubreddit);
  
//   Node View
    let nodeView = new NodeView(data, updateSelectedSubreddit);
    nodeView.drawPlots();
  
//   Ranked View
    let rankedTable = new RankedTable(data);
    let rankedTimeSeries = new RankedTimeSeries(data);
  
    rankedTable.drawTable();
    rankedTimeSeries.drawTimeSeries();

    switchView('.home-view')
});

async function loadData() {
    let jsonFile = './data_processing/config/reddit-hyperlinks-body.json';
    return await d3.json(jsonFile);
};

function drawSummaryView(data) {
    readabilityViolinPlot = new ReadabilityViolinPlot(data);
    postsLineChart = new PostsLineChart(data);
    violinPlot = new ViolinPlot(data);

    let defaultSubreddit = 'leagueoflegends';
    violinPlot.draw(defaultSubreddit);
    postsLineChart.draw(defaultSubreddit);
    readabilityViolinPlot.draw(defaultSubreddit);
}

function updateSelectedSubreddit(selection) {
    violinPlot.draw(selection);
    postsLineChart.draw(selection);
    readabilityViolinPlot.draw(selection);
}

function flattenValues(data, column) {
    let array = [];
    Object.values(data).forEach(function(subreddit) { 
        Object.values(subreddit).forEach(function(post) {
            array.push(post[column])
        })
    })
    return array;
}

function addNavigation() {
    d3.selectAll('#home-toggle').on('click' , ()=>switchView('.home-view'))
    d3.selectAll('#ranked-toggle').on('click' , ()=>switchView('.ranked-view'))
    d3.selectAll('#about-toggle').on('click' , ()=>switchView('about'))
}

function switchView(newView){
    d3.selectAll(".mainView").style("display","none")
    var startTranslateState = 'translate(2000px,0px)';
    if (newView === '.home-view'){
        startTranslateState = 'translate(-2000px,0px)';
    }
    var endTranslateState = 'translate(0px,0px)';
    var translateInterpolator = d3.interpolateString(startTranslateState, endTranslateState);

    d3.selectAll(newView).style("display","grid")
        .transition()
        .duration(1000)
        .styleTween('transform', function (d) {
            return translateInterpolator;
        });

    d3.selectAll('.nav-item').classed("active", false);
}
function objectToArray(data) {
    let outputArray = [];
    for ([key, value] of Object.entries(data)) {
        outputArray.push(value);
    }
    return outputArray;
}

// FYI: Used this as a reference for KDE code:
// https://github.com/asielen/D3_Reusable_Charts/blob/master/distro_chart/distrochart.js
// PJW
function kernelDensityEstimator(kernel, x) {
    return function (sample) {
        return x.map(function (x) {
            return {x:x, y:d3.mean(sample, function (v) {return kernel(x - v);})};
        });
    };
}
function eKernel(scale) {
    return function (u) {
        return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
    };
}
// Used to find the roots for adjusting violin axis
// Given an array, find the value for a single point, even if it is not in the domain
function eKernelTest(kernel, array) {
    return function (testX) {
        return d3.mean(array, function (v) {return kernel(testX - v);})
    }
}

function calcMetrics(values) {

    let metrics = { //These are the original non-scaled values
        max: null,
        upperOuterFence: null,
        upperInnerFence: null,
        quartile3: null,
        median: null,
        mean: null,
        iqr: null,
        quartile1: null,
        lowerInnerFence: null,
        lowerOuterFence: null,
        min: null
    };

    metrics.min = d3.min(values);
    metrics.quartile1 = d3.quantile(values, 0.25);
    metrics.median = d3.median(values);
    metrics.mean = d3.mean(values);
    metrics.quartile3 = d3.quantile(values, 0.75);
    metrics.max = d3.max(values);
    metrics.iqr = metrics.quartile3 - metrics.quartile1;

    //The inner fences are the closest value to the IQR without going past it (assumes sorted lists)
    let LIF = metrics.quartile1 - (1.5 * metrics.iqr);
    let UIF = metrics.quartile3 + (1.5 * metrics.iqr);
    for (let i = 0; i <= values.length; i++) {
        if (values[i] < LIF) {
            continue;
        }
        if (!metrics.lowerInnerFence && values[i] >= LIF) {
            metrics.lowerInnerFence = values[i];
            continue;
        }
        if (values[i] > UIF) {
            metrics.upperInnerFence = values[i - 1];
            break;
        }
    }

    metrics.lowerOuterFence = metrics.quartile1 - (3 * metrics.iqr);
    metrics.upperOuterFence = metrics.quartile3 + (3 * metrics.iqr);
    if (!metrics.lowerInnerFence) {
        metrics.lowerInnerFence = metrics.min;
    }
    if (!metrics.upperInnerFence) {
        metrics.upperInnerFence = metrics.max;
    }
    return metrics
}