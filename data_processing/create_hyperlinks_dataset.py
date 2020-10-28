import os

import altair
import pandas as pd
import yaml

source_file_path = os.path.join('.', 'config', 'soc-redditHyperlinks-body.tsv')
target_file_path = os.path.join('.', 'config', 'reddit-hyperlinks-body.json')
subreddits_yaml_path = os.path.join('.', 'config', 'subreddits.yaml')
properties_map_yaml_path = os.path.join('.', 'config', 'properties_map.yaml')

with open(source_file_path, 'r') as file:
	df = pd.read_csv(file, delimiter='\t')

with open(subreddits_yaml_path, 'r') as file:
	source_subreddits = yaml.load(file, Loader=yaml.FullLoader)

with open(properties_map_yaml_path, 'r') as file:
	properties_map = yaml.load(file, Loader=yaml.FullLoader)

df = df.loc[df.SOURCE_SUBREDDIT.isin(source_subreddits)]

print(df.head())
print(df.columns)
print('filtered data length: ', len(df))
print('Unique Source Subreddits: ', df.SOURCE_SUBREDDIT.unique())
print('Number of Unique Source Subreddits: ', len(df.SOURCE_SUBREDDIT.unique()))
print('Number of Unique Target Subreddits: ', len(df.TARGET_SUBREDDIT.unique()))

df = (
	df.sort_values('TIMESTAMP', ascending=True)
		.reset_index(drop=True)
)

print(df.TIMESTAMP.iloc[0], df.TIMESTAMP.iloc[-1])

properties_df = pd.DataFrame(
	df.PROPERTIES.str.split(',').to_list(), 
	columns=range(1, 87),
	index=df.index,
).rename(columns=properties_map)

df = pd.concat([df, properties_df], axis=1)

with open(target_file_path, 'w'):
	df.to_json(target_file_path)
