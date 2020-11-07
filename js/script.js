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
    addNavigation();
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

    sentimentBreakout.draw();
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

function addNavigation() {
    d3.selectAll('#home-toggle').on('click' , ()=>switchView('.home-view'))
    d3.selectAll('#ranked-toggle').on('click' , ()=>switchView('.ranked-view'))
    d3.selectAll('#about-toggle').on('click' , ()=>switchView('about'))
}

function switchView(newView){
    d3.selectAll(".mainView").style("display","none")
    d3.select(newView).style("display","grid")

    d3.selectAll('.nav-item').classed("active", false);
}