﻿# Gaming-Community-Toxicity

## Documents
Proposal: https://docs.google.com/document/d/1CQiJoDG1dnF1_4Cy0uXYOsIm74Qw-bKKDAcXCxzYb0k/edit#
 
Process Book: https://docs.google.com/document/d/1c6NqrIbZIaTO6lEIoFvRx7uOhNRhHHb-7e5cdiad27g/edit#

## Website Description
Website: https://lkell.github.io/Gaming-Community-Toxicity/#

Screencast: https://www.youtube.com/watch?v=lKTIW7_fnnw&feature=emb_title

## Python Libraries
Run this command:
`pip install -r requirements.txt`

## JavaScript Libraries
All libraries are linked from outside sources in index.html.

## Data Processing
Used Python for data processing, can find files in ./data_processing/ directory. Use spec-file.txt to create a Python venv and run code with it. There are two data processing files, one to get our links data set (used primarily in graph view) and one to mine comment data through the Reddit API. 

### Configuration Data

- local_user.yaml
	- See template_user.yaml for required entries. Will require you to register for Reddit API credentials. Follow instructions on website (https://towardsdatascience.com/scraping-reddit-data-1c0af3040768), then copy template_user.yaml to create a local_user.yaml file, copying in necessary information from the Reddit API (necessary fields have same name as described in towardsdatascience tutorial website).

- properties_map.yaml
	- Used to create hyperlinks data set, breaking out the properties column into 86 separate columns (specified here in the Data format section: https://snap.stanford.edu/data/soc-RedditHyperlinks.html).

- subreddits.yaml
	- Specifies which subreddits we will be using on our website.

### Link Data
Run create_hyperlinks_dataset.py with venv. You will need to download data from https://snap.stanford.edu/data/soc-RedditHyperlinks.html, specifically the soc-redditHyperlinks-body.tsv and soc-redditHyperlinks-title.tsv files (see Files section on provided website). These files are far too large to post on GitHub, hence why we require you to download it yourselves. These files are currently configured to be ignored in our .gitignore file. The output of create_hyperlinks_dataset.py is ./data_processing/config/reddit-hyperlinks-body.json. 

### Comment Data
Run create_comment_dataset.py with venv. You will need to have registered for Reddit API credentials (see local_user.yaml section for instructions). This will output one data set in the ./data_processing/config/reddit-hot-comment-sentiment-analysis.json file. This data gets the top 100 posts sorted by hot, and their associated top-level comments. We then run a VADER analysis on this data using the nltk library (https://medium.com/ro-data-team-blog/nlp-how-does-nltk-vader-calculate-sentiment-6c32d0f5046b) as well as calculate an automated readability index (https://en.wikipedia.org/wiki/Automated_readability_index).

### Data Explanation
We already provide the necessary data as calculated in our Python scripts. However, should one wish to recreate the processing data, then they can run our Python code in the provided virtual environment.

## Visualization Code and Viz Explanation
Runs from index.html, referencing our ./js/ directory for javascript static files. Stylings can be found in styles.css. Within the ./js/ directory are the node-view, ranked-view, and summary-view directories, as well as our node-plot.js and script.js files.

### node-view
Creates the graph and node visualizations, which are the top two cards on the Home page.

### network-plot.js
Creates the force-directed network plot. Gaming subreddits are encoded as nodes in the graph. The node size is proportional to the number of hyperlinks directed towards other gamining subreddits, and the color encodes the average VADER sentiment of the posts containing those links. The directed edges represent hyperlinks specifically pointing from one subreddit to another. Quantity of hyperlinks is encoded by edge width and average sentiment is encoded by color. The slider at the top right corner of the chart allows a minimum number of hyperlinks to be selected such that any edge below the threshold is removed. Clicking on a node updates the selected subreddit in the other charts of the home page.

### node-plot.js
Creates the node plot which displays top outgoing linked subreddits from the selected subreddit. The links are encoded as directed edges, which, similar to the network plot, encode the number of links and average sentiment associated with the links by edge width and color. The dropdown selector allows the user to specifiy "top 10" outgoing subreddit criterion according to highest number of links, most positive average sentiment, or most negative average sentiment. Hovering the mouse over each node brings up a tooltip which specifies the number of links and average sentiment.

### ranked-view
Create the ranked view, including the timeseries charts and sortable table.

#### ranked-time-series.js
Creates the three timeseries charts at the top of the ranked view.

#### ranked-table.js
Creates the table on the bottom of the ranked view. Includes subreddit, links, density plots and the positive/negative/compound heatmap

### summary-view
Creates the summary view, specifically the bottom three visualizations on the Home Page.

#### violin-plot.js
Creates the violin plot detailing the VADER comment sentiment analysis of the top level comments of the top 100 hottest posts at a given point in time for each subreddit. The Violin Plot measures the Compound Sentiment specifically, which is measured on a scale from -1 (most negative) to 1 (most positive). It also has an interquartile box and median, both of which have a tooltip that specify the actual values, and the interquartile box tooltip also gives a few additional statistics.

#### ts-posts-line-chart.js
Creates a line chart with dots at each month for the time range from January 2014 to April 2017, giving the number of links to other subreddits per month. This chart is meant to measure the relative activity of a given subreddit over time. Ideally, this would actually measure something else, like posts, but due to time and computational limitations, we chose to simply use the already collected data about links. This visualization also has a tooltip that gives the number of links for each month on each month's dot.

#### readability-violin-plot.js
Creates the violin plot detailing the Automated Readability Index comment of the top level comments of the top 100 hottest posts at a given point in time for each subreddit. The Automated Readability Index is intended to be measured from 1 and above, although depending on how poorly written or unorthodox a given comment is (such as having bullet points), it could end up being negative. Generally, a value of 1 corresponds to a 5-6 year old reading level (Kindergarten) while 14 corresponds to a 24+ year old (Professor level). It also has an interquartile box and median, both of which have a tooltip that specify the actual values, and the interquartile box tooltip also gives a few additional statistics.

### script.js
This is our main file for running the visualization code. It also contains some util functions that are used across several different visualizations. Additionally, this is where our callback functions are located.

### story-telling
#### story-telling.js
This creates the story telling code. Links to the "Show me..." dropdown, which will create a div over the graph plot. To remove the div overlay, simply click anywhere.
