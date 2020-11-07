let globalData;

loadData().then(data => {
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
    globalData = data;
    drawSummaryView(data);
});

async function loadData() {
    let jsonFile = './data_processing/config/reddit-hyperlinks-body.json';
    return await d3.json(jsonFile);
};

function drawSummaryView(data) {
    sentimentBreakout = new SentimentBreakout(data);
    postsLineChart = new PostsLineChart(data);
    violinPlot = new ViolinPlot(data);

    sentimentBreakout.draw('gaming');
    postsLineChart.draw('gaming');
    violinPlot.draw();
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