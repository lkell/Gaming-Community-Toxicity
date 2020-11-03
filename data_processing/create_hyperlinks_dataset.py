import os
import json

from pprint import pprint

import altair
import pandas as pd
import yaml

body_source_file_path = os.path.join('.', 'config', 'soc-redditHyperlinks-body.tsv')
title_source_file_path = os.path.join('.', 'config', 'soc-redditHyperlinks-title.tsv')
target_file_path = os.path.join('.', 'config', 'reddit-hyperlinks-body.json')
subreddits_yaml_path = os.path.join('.', 'config', 'subreddits.yaml')
properties_map_yaml_path = os.path.join('.', 'config', 'properties_map.yaml')

with open(body_source_file_path, 'r') as file:
	df = pd.read_csv(file, delimiter='\t')

with open(title_source_file_path, 'r') as file:
	df = df.append(pd.read_csv(file, delimiter='\t')).reset_index(drop=True)

with open(subreddits_yaml_path, 'r') as file:
	source_subreddits = yaml.load(file, Loader=yaml.FullLoader)
	for i in range(len(source_subreddits)):
		source_subreddits[i] = source_subreddits[i].lower()

with open(properties_map_yaml_path, 'r') as file:
	properties_map = yaml.load(file, Loader=yaml.FullLoader)

df = df.assign(
	SOURCE_SUBREDDIT=df.SOURCE_SUBREDDIT.str.lower(),
	TARGET_SUBREDDIT=df.TARGET_SUBREDDIT.str.lower(),
)

df = df.loc[df.SOURCE_SUBREDDIT.isin(source_subreddits)]

pprint('Unique Source Subreddits: ')
pprint(list(df.SOURCE_SUBREDDIT.unique()))
pprint(f'Number of Unique Source Subreddits: {len(df.SOURCE_SUBREDDIT.unique())}')
pprint(f'Number of Unique Target Subreddits: {len(df.TARGET_SUBREDDIT.unique())}')
pprint(f'Initial filtered data length: {len(df)}')

properties_df = pd.DataFrame(
	df.PROPERTIES.str.split(',').to_list(), 
	columns=range(1, 87),
	index=df.index,
).rename(columns=properties_map)#.drop(columns=['PROPERTIES'])
df = df.drop(columns=['PROPERTIES'])

df = pd.concat([df, properties_df], axis=1)
df.TIMESTAMP = pd.to_datetime(df.TIMESTAMP)
col_ix = ['SOURCE_SUBREDDIT', 'POST_ID']

# FYI: Dropping duplicates does result in some record loss, though these seem to be 
# duplicate posts PJW
df = (
	df.sort_values(col_ix + ['TIMESTAMP'], ascending=True)
		.drop_duplicates(col_ix, keep='last')
		.reset_index(drop=True)
		.set_index(col_ix)
)
df.TIMESTAMP = df.TIMESTAMP.astype(str)
# pprint(f'Post duplicate drop filtered data length: {len(df)}')

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
