let globalData;

Promise.all([
    d3.json('./data_processing/config/reddit-hyperlinks-body.json'),
    d3.json('./data_processing/config/reddit-hot-comment-sentiment-analysis.json'),
]).then(files => {
    let data = files[0];
    let hotCommentData = files[1];
    removeUnconnectedSubreddits(hotCommentData, data);
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
    Object.keys(hotCommentData).forEach(function(subreddit) {
            Object.keys(hotCommentData[subreddit]).forEach(function(postId) {
                Object.keys(hotCommentData[subreddit][postId]).forEach(function(column) {
                    if ((column != 'timestamp') && (column != 'TARGET_SUBREDDIT')) {
                        hotCommentData[subreddit][postId][column] = +hotCommentData[subreddit][postId][column]
                    }
                })
                hotCommentData[subreddit][postId]['TIMESTAMP'] = new Date(hotCommentData[subreddit][postId]['timestamp'])
            })
        });

    setupDropDown(data, updateSelectedSubreddit);
    d3.selectAll(".load-notifier").style("display", "none");
    d3.selectAll(".loading-container").style("height",0);

    addNavigation();
    globalData = data;

//   Summary View

    readabilityViolinPlot = new ReadabilityViolinPlot(hotCommentData);
    postsLineChart = new PostsLineChart(data);
    violinPlot = new ViolinPlot(hotCommentData);  
    let defaultSubreddit = 'leagueoflegends';
    violinPlot.draw(defaultSubreddit);
    postsLineChart.draw(defaultSubreddit);
    readabilityViolinPlot.draw(defaultSubreddit);
  
//   Node View
    nodeView = new NodeView(data, updateSelectedSubreddit);
    nodeView.drawPlots();
  
//   Ranked View
    rankedTable = new RankedTable(hotCommentData, updateSelectedSubreddit);
    rankedTimeSeries = new RankedTimeSeries(data);

    updateSelectedSubreddit(defaultSubreddit);
    let storySubreddits = new Object();
    storySubreddits.toxicSubreddit = rankedTable.mostToxic;
    storySubreddits.lovingSubreddit = rankedTable.mostLoving;
    storySubreddits.spikeLinksSubreddit = 'pokemongo';
    storySubreddits.mostActiveSubreddit = 'gaming';
    storySubreddits.mostPolarizedSubreddit = 'truegaming';
    storySubreddits.mostLinksSubreddit = nodeView.getMostLinksSubreddit();
    let storyTeller = new StoryTeller(storySubreddits);
    setupStoryTellingDropDown(storyTeller);
    switchView('.home-view')
});

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
    nodeView.updatePlots(selection);
    $('#subreddit-dropdown-container').find("button").text(selection);
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
    d3.selectAll('#about-toggle').on('click' , ()=>switchView('.about-view'))
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

function setupDropDown(data, eventFun) {
    let gamingSubreddits = Object.keys(data)
    let dropDown = document.getElementById("dropdown-items");

    for (let subreddit of gamingSubreddits) {
      let option = document.createElement("a");
      option.text = subreddit;
      option.setAttribute("class", "dropdown-item");
      option.setAttribute("href", "#");
      dropDown.appendChild(option);
    }

    // https://stackoverflow.com/questions/45854862/selected-value-in-drop-down-returning-undefined-in-javascript
    $('#subreddit-dropdown-container').find('a').click(event => {
      let selection = event.target.innerText;
      eventFun(selection);
     })
}

function setupStoryTellingDropDown(storyTeller) {
    let dropDown = document.getElementById('story-teller-dropdown');
    $('#loving-choice').click(event => storyTeller.displayMostLovingSubreddit(event));
    $('#toxic-choice').click(event => storyTeller.displayMostToxicSubreddit(event));
    $('#highest-activity-choice').click(event => storyTeller.displayLargestFluctuationInActivity(event));
    $('#link-choice').click(event => storyTeller.displayMostLinksSubreddit(event));
}

function formatNumberToDecimalPlaces(num, decimalPlaces) {
    let fraction = parseFloat((parseFloat(num) % 1).toFixed(decimalPlaces));
    let wholeNumber = parseInt(num);
    return wholeNumber + fraction;
}

function removeUnconnectedSubreddits(hotCommentData, data) {
    let keepSubreddits = Object.keys(data);
    for (let subreddit of Object.keys(hotCommentData)) {
        if (!keepSubreddits.includes(subreddit)) {
            delete hotCommentData[subreddit];
        }
    }
}