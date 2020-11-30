class StoryTeller {

	constructor(storySubreddits) {
		this.root = d3.select('#node');
		this.storySubreddits = storySubreddits;
	}

	addStoryTellerDiv() {
		let that = this;
		d3.select('#story-teller-div').remove();
		document.body.addEventListener('click', this.removeStory);
		this.storyTellerDiv = this.root.append('div')
            .attr('id', 'story-teller-div')
			.classed('tooltip', true);
	}

	removeStory(event) {
		if (event.target.parentNode.id == "story-teller-dropdown") {
			return;
		}
		d3.select('#story-teller-div').style('display', 'none');
		d3.select("#storytellingButton").text("Show me...")
	}

	displayMostLovingSubreddit(event) {
		this.addStoryTellerDiv();
		let subreddit = this.storySubreddits.lovingSubreddit;
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.lovingSubredditHtml(subreddit));
		this.updateStorytellingLabel(event);
	}

	lovingSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h2>' + subreddit + '</h2>';
        outputString += '<p>We found this to be the most loving subreddit, according to the median compound comment sentiment</p>';
        return outputString;
	}

	displayMostToxicSubreddit(event) {
		this.addStoryTellerDiv();
		let subreddit = this.storySubreddits.toxicSubreddit;
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.toxicSubredditHtml(subreddit));
		this.updateStorytellingLabel(event);
	}

	toxicSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h2>' + subreddit + '</h2>';
        outputString += '<p>We found this to be the most toxic subreddit, according to the 1st quartile compound comment sentiment</p>';
        return outputString;
	}

	displayLargestFluctuationInActivity(event) {
		this.addStoryTellerDiv();
		// FYI: the pokemongo subreddit goes off the scale, so we would like to highlight it PJW
		let subreddit = this.storySubreddits.spikeLinksSubreddit;
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.linksSubredditHtml(subreddit));
		this.updateStorytellingLabel(event);
	}

	linksSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h2>' + subreddit + '</h2>';
        outputString += '<p>The pokemongo subreddit broke our subreddits time series plots scale for the month of July 2016, when the massively popular mobile game was first released.</p>';
        return outputString;
	}

	displayMostLinksSubreddit(event) {
		this.addStoryTellerDiv();
		let subreddit = this.storySubreddits.mostLinksSubreddit;
		updateSelectedSubreddit(subreddit.id);
		this.storyTellerDiv.html(this.mostLinksHTML(subreddit));
		this.updateStorytellingLabel(event);
	}

	mostLinksHTML(subreddit) {
		return `<h2>${subreddit.id}</h2><p>${subreddit.description}</p>`;
	}

	updateStorytellingLabel(event) {
		d3.select("#storytellingButton").text(event.target.innerHTML);
	}

}