/**
 * Manage the graph data structure and handle the network and node plots.
 */
class NodeView {
  constructor(data, updateFun) {
    this.data = this.unnestData(data);

    this.gamingSubreddits = Object.keys(data);
    this.subreddits = this.makeSubredditList(this.data);

    this.links = this.createLinkData(this.data);
    this.nodes = this.createNodeData(this.links, this.subreddits);

    this.gamingOnlyLinks = this.links.filter((link) =>
      this.gamingSubreddits.includes(link.target)
    );
    this.gamingOnlyNodes = this.createNodeData(
      this.gamingOnlyLinks,
      this.gamingSubreddits
    );

    this.colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([1, -1]);

    this.nodePlot = new NodePlot(
      "#node-summary",
      700,
      600,
      this.nodes,
      this.links,
      this.colorScale
    );

    // this.updateFun = this.extendUpdateFun(updateFun);
    this.networkPlot = new NetworkPlot(
      "#node",
      1000,
      600,
      this.gamingOnlyNodes,
      this.gamingOnlyLinks,
      this.colorScale,
      updateFun
    );
  }

  makeSubredditList(data) {
    let targets = data.map((d) => d.TARGET_SUBREDDIT);
    let sources = data.map((d) => d.SOURCE_SUBREDDIT);
    return [...new Set(targets.concat(sources))];
  }

  extendUpdateFun(updateFun) {
    let nodePlot = this.nodePlot;
    return function (selection) {
      updateFun(selection);
      nodePlot.updatePlot(selection);
    };
  }

  drawPlots() {
    this.networkPlot.draw();
  }

  updatePlots(selection) {
    this.networkPlot.updateSelectedSubreddit(selection);
    this.nodePlot.updatePlot(selection);
  }
  /** Flatten data so each entry in list corresponds to one post */
  unnestData(data) {
    let unnestedData = [];
    for (let [target, sourcePosts] of Object.entries(data)) {
      for (let key in sourcePosts) {
        let post = Object.assign({}, sourcePosts[key]);
        post.SOURCE_SUBREDDIT = target;
        unnestedData.push(post);
      }
    }
    return unnestedData;
  }
  createNodeData(links, subreddits) {
    let getRelatedLinks = function (subreddit) {
      let outbound = links.filter((link) => link.source == subreddit);
      return outbound;
    };

    return subreddits.map(function (subreddit) {
      let relatedLinks = getRelatedLinks(subreddit);
      let interactions = d3.count(relatedLinks, (link) => link.mentions);
      let totalHyperlinks = d3.sum(relatedLinks, (link) => link.mentions);
      let positivity = d3.mean(relatedLinks, (link) => link.sentiment);
      return {
        id: subreddit,
        label: subreddit,
        interactions: interactions,
        totalHyperlinks: totalHyperlinks,
        positivity: positivity,
      };
    });
  }

  /** Create a list of link objects */
  createLinkData(data) {
    let rolledSummaries = d3
      .nest()
      .key((d) => d.SOURCE_SUBREDDIT)
      .key((d) => d.TARGET_SUBREDDIT)
      .rollup((v) => ({
        sentiment: d3.mean(v, (d) => d.CompoundSentiment),
        mentions: v.length,
      }))
      .object(data);

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

    return links;
  }
}
