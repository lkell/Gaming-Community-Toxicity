class NodePlot {
  constructor(data, activeSubreddit, mode) {
    this.width = 1200;
    this.height = 1200;
    this.root = d3
      .select("#node-view-container")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);

    this.subreddits = Object.keys(data);
    this.data = this.unnestData(data).filter((d) =>
      this.subreddits.includes(d.TARGET_SUBREDDIT)
    );
    this.nodes = this.createNodeData();
    this.links = this.createLinkData();
  }

  createNodeData() {
    return this.subreddits.map((subreddit) => ({
      id: subreddit,
      label: subreddit,
    }));
  }

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
        vals.source = source;
        vals.target = target;
        links.push(vals);
      }
    }

    return links;
  }

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
