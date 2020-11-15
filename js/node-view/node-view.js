class NodeView {
  constructor(data, updateFun) {
    // this.activeSubreddit = activeSubreddit;
    this.subreddits = Object.keys(data);
    this.data = this.unnestData(data).filter((d) =>
      this.subreddits.includes(d.TARGET_SUBREDDIT)
    );
    this.minLinks = 10;
    this.links = this.createLinkData();
    this.nodes = this.createNodeData(this.links);
    console.log("here:");
    console.log(this.nodes);
    this.shiftX = 0;
    this.circles;
    this.paths;

    this.nodePlot = new NodePlot(
      "#node-summary",
      600,
      500,
      this.nodes,
      this.links
    );

    this.networkPlot = new NetworkPlot(
      "#node",
      1000,
      500,
      this.nodes,
      this.links,
      this.extendUpdateFun(updateFun)
    );
    this.populateDropdown();
  }

  populateDropdown() {
    let dropDown = document.getElementById("dropdown-items");

    console.log(dropDown);
    for (let subreddit of this.subreddits) {
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

  createNodeData(links) {
    let getRelatedLinks = function (subreddit) {
      let outbound = links.filter((link) => link.source == subreddit);
      let inbound = links.filter((link) => link.target == subreddit);
      return outbound.concat(inbound);
    };

    return this.subreddits.map(function (subreddit) {
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
