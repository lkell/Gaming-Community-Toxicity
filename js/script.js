loadData().then(data => {
    console.log(data);
});

async function loadData() {
    return await d3.json('./data_processing/config/reddit-hyperlinks-body.json');
};