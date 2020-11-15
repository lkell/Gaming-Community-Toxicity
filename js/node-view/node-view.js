class NodeView {
  constructor(data, updateFun) {
    // this.activeSubreddit = activeSubreddit;
    this.subreddits = Object.keys(data);
    this.data = this.unnestData(data).filter((d) =>
      this.subreddits.includes(d.TARGET_SUBREDDIT)
    );
    this.minLinks = 10;
    this.nodes = this.createNodeData();
    this.links = this.createLinkData();
    this.shiftX = 0;
    this.circles;
    this.paths;

    this.nodePlot = new NodePlot(
      "#node-summary",
      600,
      500,
      this.nodes,
      this.links,
    );

    this.networkPlot = new NetworkPlot(
      "#node",
      1000,
      500,
      this.nodes,
      this.links,
      this.extendUpdateFun(updateFun)
    );
  }

  extendUpdateFun(updateFun) {
    let nodePlot = this.nodePlot;
    return function(selection) {
      updateFun(selection);
      nodePlot.draw(selection);
    }
  }

  drawPlots() {
    this.networkPlot.draw();
  }

  updatePlots(selection) {
    this.nodePlot.draw(selection);
  }

  createNodeData() {
    return this.subreddits.map((subreddit) => ({
      id: subreddit,
      label: subreddit,
    }));
  }

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([1.5, 5]);
  }

  /** Create a list of link objects */
  createLinkData() {
    let rolledSummaries = d3
      .nest()
      .key((d) => d.SOURCE_SUBREDDIT)
      .key((d) => d.TARGET_SUBREDDIT)
      .rollup((v) => ({
        sentiment: d3.mean(v, (d) => d.LINK_SENTIMENT),
        mentions: v.length,
      }))
      .object(this.data);

    let links = [];
    for (let source of Object.keys(rolledSummaries)) {
      for (let target of Object.keys(rolledSummaries[source])) {
        let vals = rolledSummaries[source][target];
        vals.id = source + "-" + target;
        vals.source = source;
        vals.target = target;
        links.push(vals);
      }
    }

    return links.filter((link) => link.mentions >= this.minLinks);
  }

  /** Flatten data so each entry in list corresponds to one post */
  unnestData = function (data) {
    let unnestedData = [];
    for (let [target, sourcePosts] of Object.entries(data)) {
      for (let key in sourcePosts) {
        let post = Object.assign({}, sourcePosts[key]);
        post.SOURCE_SUBREDDIT = target;
        unnestedData.push(post);
      }
    }
    return unnestedData;
  };
}
