class NodeView {
  constructor(data, updateFun) {
    // this.activeSubreddit = activeSubreddit;
    this.data = this.unnestData(data);

    this.gamingSubreddits = Object.keys(data);
    this.gamingOnlyData = this.data.filter((d) =>
      this.gamingSubreddits.includes(d.TARGET_SUBREDDIT)
    );

    this.subreddits = this.makeSubredditList(this.data);

    this.minLinks = 10;
    this.links = this.createLinkData(this.data, 0);
    this.nodes = this.createNodeData(this.links, this.subreddits);

    this.gamingOnlyLinks = this.createLinkData(
      this.gamingOnlyData,
      this.minLinks
    );
    this.gamingOnlyNodes = this.createNodeData(this.gamingOnlyLinks, this.gamingSubreddits);
    this.shiftX = 0;
    this.circles;
    this.paths;

    this.nodePlot = new NodePlot(
      "#node-summary",
      610,
      500,
      this.nodes,
      this.links
    );

    this.networkPlot = new NetworkPlot(
      "#node",
      950,
      500,
      this.gamingOnlyNodes,
      this.gamingOnlyLinks,
      this.extendUpdateFun(updateFun)
    );
    this.populateDropdown();
  }

  makeSubredditList(data) {
    let targets = data.map(d => d.TARGET_SUBREDDIT);
    let sources = data.map(d => d.SOURCE_SUBREDDIT);
    return [... new Set(targets.concat(sources))];
  }

  populateDropdown() {
    let dropDown = document.getElementById("dropdown-items");

    for (let subreddit of this.gamingSubreddits) {
      let option = document.createElement("a");
      option.text = subreddit;
      option.setAttribute("class", "dropdown-item");
      option.setAttribute("href", "#");
      dropDown.appendChild(option);
    }
  }

  extendUpdateFun(updateFun) {
    let nodePlot = this.nodePlot;
    return function (selection) {
      updateFun(selection);
      nodePlot.draw(selection);
    };
  }

  drawPlots() {
    this.networkPlot.draw();
  }

  updatePlots(selection) {
    this.nodePlot.draw(selection);
  }

  createNodeData(links, subreddits) {
    let getRelatedLinks = function (subreddit) {
      let outbound = links.filter((link) => link.source == subreddit);
      let inbound = links.filter((link) => link.target == subreddit);
      return outbound;
      // return outbound.concat(inbound);
    };

    return subreddits.map(function (subreddit) {
      let relatedLinks = getRelatedLinks(subreddit);
      let interactions = d3.count(relatedLinks, (link) => link.mentions);
      let positivity = d3.mean(relatedLinks, (link) => link.sentiment);
      return {
        id: subreddit,
        label: subreddit,
        interactions: interactions,
        positivity: positivity,
      };
    });
  }

  makeStrokeWidthScale(links) {
    let maximum = d3.max(links, (link) => link.mentions);
    let minimum = d3.min(links, (link) => link.mentions);
    return d3.scaleLinear().domain([minimum, maximum]).range([1.5, 5]);
  }

  /** Create a list of link objects */
  createLinkData(data, minLinks) {
    let rolledSummaries = d3
      .nest()
      .key((d) => d.SOURCE_SUBREDDIT)
      .key((d) => d.TARGET_SUBREDDIT)
      .rollup((v) => ({
        sentiment: d3.mean(v, (d) => d.LINK_SENTIMENT),
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

    return links.filter((link) => link.mentions >= minLinks);
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
