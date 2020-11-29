class StoryTeller {

	constructor(storySubreddits) {
		this.root = d3.select('#node');
		this.storySubreddits = storySubreddits;
	}

	addStoryTellerDiv() {
		let that = this;
		d3.select('#story-teller-div').remove();
		document.body.addEventListener('click', this.removeDiv)
		this.storyTellerDiv = this.root.append('div')
            .attr('id', 'story-teller-div')
            .classed('tooltip', true);
	}

	removeDiv() {
		d3.select('#story-teller-div').style('display', 'none');
	}

	displayMostLovingSubreddit() {
		this.addStoryTellerDiv();
		let subreddit = this.storySubreddits.lovingSubreddit;
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.lovingSubredditHtml(subreddit));
	}

	lovingSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h3>r/' + subreddit + '</h3>';
        outputString += '<p>We found this to be the most loving subreddit, according to the median compound comment sentiment</p>';
        return outputString;
	}

	displayMostToxicSubreddit() {
		this.addStoryTellerDiv();
		let subreddit = this.storySubreddits.toxicSubreddit;
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.toxicSubredditHtml(subreddit));
	}

	toxicSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h3>r/' + subreddit + '</h3>';
        outputString += '<p>We found this to be the most toxic subreddit, according to the 1st quartile compound comment sentiment</p>';
        return outputString;
	}

	displayLargestFluctuationInActivity() {
		this.addStoryTellerDiv();
		// FYI: the pokemongo subreddit goes off the scale, so we would like to highlight it PJW
		let subreddit = this.storySubreddits.spikeLinksSubreddit;
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.linksSubredditHtml(subreddit));
	}

	linksSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h3>r/' + subreddit + '</h3>';
        outputString += '<p>The pokemongo subreddit broke our subreddits time series plots scale for the month of July 2016, when the massively popular mobile game was first released.</p>';
        return outputString;
	}

	displayMostLinksSubreddit() {
		this.addStoryTellerDiv();
		let subreddit = this.storySubreddits.mostLinksSubreddit;
		updateSelectedSubreddit(subreddit.id);
		this.storyTellerDiv.html(this.mostLinksHTML(subreddit));
	}

	mostLinksHTML(subreddit) {
		return `<h3>r/${subreddit.id}</h3><p>${subreddit.description}</p>`;
	}

}