# Gaming-Community-Toxicity
 
README - The README file must give an overview of what you are handing in: which parts are your code, which parts are libraries, and so on. The README must contain URLs to your project websites and screencast videos. The README must also explain any non-obvious features of your interface.

Find proposal here: https://docs.google.com/document/d/1CQiJoDG1dnF1_4Cy0uXYOsIm74Qw-bKKDAcXCxzYb0k/edit#
 
Find process book here: https://docs.google.com/document/d/1c6NqrIbZIaTO6lEIoFvRx7uOhNRhHHb-7e5cdiad27g/edit#
 
For the process book, use template on first page for entries to maintain stylistic consistency.

## Website Description
https://lkell.github.io/Gaming-Community-Toxicity/#

LINK TO SCREENCAST YOUTUBE/VIMEO LINK HERE

DESCRIBE WEBSITE, FOCUSING ON NON-OBVIOUS ASPECTS.

## Python Libraries
`pip install -r requirements.txt`

## JavaScript Libraries
All libraries are linked from outside sources. BREAK DOWN WHAT SOURCES WE ARE CURRENTLY USING.

## Data Processing
Used Python for data processing, can find files in ./data_processing/ directory. Use spec-file.txt to create a Python venv and run code with it. There are two data processing files, one to get our links data set (used primarily in graph view) and one to mine comment data through the Reddit API. 

### Configuration Data

#### local_user.yaml
See template_user.yaml for required entries. Will require you to register for Reddit API credentials. Follow instructions on website (https://towardsdatascience.com/scraping-reddit-data-1c0af3040768), then copy template_user.yaml to create a local_user.yaml file, copying in necessary information from the Reddit API (necessary fields have same name as described in towardsdatascience tutorial website).

#### properties_map.yaml
Used to create hyperlinks data set, breaking out the properties column into 86 separate columns (specified here in the Data format section: https://snap.stanford.edu/data/soc-RedditHyperlinks.html).

#### subreddits.yaml
Specifies which subreddits we will be using on our website.

### Link Data
Run create_hyperlinks_dataset.py with venv. You will need to download data from https://snap.stanford.edu/data/soc-RedditHyperlinks.html, specifically the soc-redditHyperlinks-body.tsv and soc-redditHyperlinks-title.tsv files (see Files section on provided website). These files are far too large to post on GitHub, hence why we require you to download it yourselves. These files are currently configured to be ignored in our .gitignore file. The output of create_hyperlinks_dataset.py is ./data_processing/config/reddit-hyperlinks-body.json. 

### Comment Data
Run create_comment_dataset.py with venv. You will need to have registered for Reddit API credentials (see local_user.yaml section for instructions). This will output three data sets in the ./data_processing/config/ directory: THREE FILES HERE. This data gets the top 100 posts sorted by hot, top, and controversial, and their associated top-level comments. We then run a VADER analysis on this data using the nltk library (VADER description link: LINK HERE)as well as calculate an automated readability index (description: LINK HERE).

## Data Explanation
Don't have to run code! Data already provided, code and instructions for if you want to run processing code yourself :)

## Visualization Code
Runs from index.html, referencing our ./js/ directory for javascript static files. Stylings can be found in styles.css. Within the ./js/ directory are the node-view, ranked-view, and summary-view directories, as well as our node-plot.js and script.js files.

### node-view
Creates the node view. FILL OUT AND SPECIFY WHICH VISUALIZATIONS THIS DRIVES.

### ranked-view
Create the ranked view. FILL OUT AND SPECIFY WHICH VISUALIZATIONS THIS DRIVES.

### summary-view
Creates the summary view. FILL OUT AND SPECIFY WHICH VISUALIZATIONS THIS DRIVES.

### node-plot.js
EXPLAIN WHAT THIS DOES, AND WHY IT ISN'T IN node-view.

### script.js
OUR MAIN FILE, CONTAINING UTILS AND LOADING INFO. FILL OUT AND EXPLAIN.