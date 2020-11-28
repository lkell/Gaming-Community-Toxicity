class StoryTeller {

	constructor(findMostLovingSubreddit, findMostToxicSubreddit, findMostLinksSubreddit) {
		this.root = d3.select('#node')
		this.findMostLovingSubreddit = findMostLovingSubreddit;
		this.findMostToxicSubreddit = findMostToxicSubreddit;
		this.findMostLinksSubreddit = findMostLinksSubreddit;
	}

	addStoryTellerDiv() {
		let that = this;
		d3.select('#story-teller-div').remove();
		document.body.addEventListener('click', this.removeDiv)
		this.storyTellerDiv = this.root.append('div')
            .attr('id', 'story-teller-div')
            .on('mouseover', that.removeDiv)
            .classed('tooltip', true);
	}

	removeDiv() {
		d3.select('#story-teller-div').style('display', 'none');
		document.body.removeEventListener('click', this.removeDiv);
	}

	displayMostLovingSubreddit() {
		// TODO: Need to use callback function to ranked view; MLN is handling PJW
		this.addStoryTellerDiv();
		let subreddit = 'stardewvalley';
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.lovingSubredditHtml(subreddit));
	}

	lovingSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>We found this to be the most loving subreddit, according to the median compound sentiment</p>';
        return outputString;
	}

	displayMostToxicSubreddit() {
		this.addStoryTellerDiv();
		let subreddit = 'kotakuinaction';
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.toxicSubredditHtml(subreddit));
	}

	toxicSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>We found this to be the most toxic subreddit, according to the 1st quartile compound sentiment</p>';
        return outputString;
	}

	displayLargestFluctuationInActivity() {
		this.addStoryTellerDiv();
		// FYI: the pokemongo subreddit goes off the scale, so we would like to highlight it PJW
		let subreddit = 'pokemongo';
		updateSelectedSubreddit(subreddit);
		this.storyTellerDiv.html(this.linksSubredditHtml(subreddit));
	}

	linksSubredditHtml(subreddit) {
        let outputString = ''
        outputString += '<h2>r/' + subreddit + '</h2>';
        outputString += '<p>The pokemongo subreddit broke our subreddits time series plots scale for the month of July 2016.</p>';
        return outputString;
	}

}