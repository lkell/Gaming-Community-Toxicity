# Used this as a reference: https://medium.com/@woneuy01_5877/reddit-comment-sentiment-analysis-a07cc852ac1c PJW

import json
import os
import praw
import pandas as pd
import datetime as dt
import numpy as np
import yaml
import nltk
import textstat
from nltk.sentiment.vader import SentimentIntensityAnalyzer as SIA
from pprint import pprint


user_path = os.path.join('.', 'config', 'local_user.yaml')
hot_comment_file_path = os.path.join('.', 'config', 'reddit-hot-comment-sentiment-analysis.json')
controversial_comment_file_path = os.path.join('.', 'config', 'reddit-controversial-comment-sentiment-analysis.json')
top_comment_file_path = os.path.join('.', 'config', 'reddit-top-comment-sentiment-analysis.json')
subreddits_yaml_path = os.path.join('.', 'config', 'subreddits.yaml')

with open(subreddits_yaml_path, 'r') as file:
    subreddits = yaml.load(file, Loader=yaml.FullLoader)

with open(user_path, 'r') as file:
    user_config = yaml.load(file, Loader=yaml.FullLoader)

reddit = praw.Reddit(
    client_id=user_config['client_id'], 
    client_secret=user_config['client_secret'],
    user_agent = user_config['user_agent'],
)

def create_sentiment_yaml(target_file_path, reddit, subreddits, user_config, comment_type):
    results = []
    for subreddit in subreddits:
        print(subreddit)
        if comment_type == 'hot':
            hot_posts = reddit.subreddit(subreddit).hot(limit=100)
        elif comment_type == 'controversial':
            hot_posts = reddit.subreddit(subreddit).controversial(limit=100)
        else:
            hot_posts = reddit.subreddit(subreddit).top(limit=100)
        posts = []
        for post in hot_posts:
            posts.append(
                [
                    post.title, 
                    post.score, 
                    post.id, 
                    'https://www.reddit.com'+post.permalink,
                    post.subreddit, 
                    post.url, 
                    post.num_comments, 
                    post.selftext, 
                    dt.datetime.fromtimestamp(post.created)
                ])

        posts = pd.DataFrame(posts,columns=[
                'title', 
                'score', 
                'id', 
                'permalink',
                'subreddit', 
                'url', 
                'num_comments', 
                'body', 
                'created',
            ])

        ix = 0
        for post_id in posts.id:
            submission = reddit.submission(id=post_id)
            timestamp = dt.datetime.fromtimestamp(int(submission.created_utc))
            submission.comments.replace_more(limit=0)
            comments = set()
            # collect top level comment body
            for top_level_comment in submission.comments:
                if len(comments) <= 200:
                    comments.add(top_level_comment.body)
                else:
                    break

            nltk.download('vader_lexicon')
            sia = SIA()
            
            for line in comments:
                ix += 1
                pol_score = sia.polarity_scores(line)
                pol_score['AutoReadabilityIndex'] = textstat.automated_readability_index(line)
                pol_score['subreddit'] = subreddit
                pol_score['timestamp'] = timestamp
                pol_score['ix'] = ix
                results.append(pol_score)

    df = pd.DataFrame.from_records(results)
    df.timestamp = df.timestamp.astype(str)
    df.subreddit = df.subreddit.str.lower()
    df = df.rename(columns={
        'pos': 'PositiveSentiment',
        'neg': 'NegativeSentiment',
        'compound': 'CompoundSentiment',
    })
    df = df.set_index(['subreddit', 'ix'])

    def nest_df_into_json(df):
        subreddits_ix = list(df.index.get_level_values(0).unique())
        output_dict = dict()
        for subreddit_ix in subreddits_ix:
            interim_df = df.loc[subreddit_ix]
            output_dict[subreddit_ix] = interim_df.to_dict(orient='index')
        return output_dict

    nested_data = nest_df_into_json(df)

    with open(target_file_path, 'w') as dump_data:
        json.dump(nested_data, dump_data)

create_sentiment_yaml(hot_comment_file_path, reddit, subreddits, user_config, 'hot')
# create_sentiment_yaml(top_comment_file_path, reddit, subreddits, user_config, 'controversial')
# create_sentiment_yaml(controversial_comment_file_path, reddit, subreddits, user_config, 'top')