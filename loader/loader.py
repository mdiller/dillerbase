import json
import aiohttp
import asyncio
import os
import re
from datetime import datetime
from dillerbase_schema import *

# read our .env file as if it was a json config file
current_directory = os.path.dirname(os.path.realpath(__file__))
parent_directory = os.path.abspath(os.path.join(current_directory, ".."))
env_path = os.path.join(parent_directory, ".env")
config = {}
with open(env_path, "r") as f:
	text = f.read()
	for line in text.split("\n"):
		match = re.match(r"([^=]+)=(.+)", line)
		if match:
			config[match.group(1)] = match.group(2)

db_url = "postgres://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{DB_IP_ADDRESS}:{DB_POSTGRES_PORT}/{POSTGRES_DB}".format(config)

project_fields = [ 
	"kills",
	"deaths",
	"assists",
	"hero_id",
	"level",
	"gold_per_min",
	"item_0",
	"item_1",
	"item_2",
	"item_3",
	"item_4",
	"item_5",
	"item_neutral",
	"start_time"
]

async def fetch_data():
	steam_id = config["STEAM_ID"]
	url = f"https://api.opendota.com/api/players/{steam_id}/matches?limit=20"  # Replace with your API endpoint
	url += "".join(map(lambda x: f"&project={x}", project_fields))
	
	async with aiohttp.ClientSession() as session:
		async with session.get(url) as response:
			if response.status == 200:
				data = await response.json()
				return data
			else:
				print(f"Error: {response.status}")
				return None



def insert_data(data, session):
	try:
		# Loop through the JSON data and insert each object into the database
		for match in data:

			items = []
			for i in range(6):
				key = f"item_{i}"
				items.append(match[key])
				del match[key]
			match["won"] = match["radiant_win"] == (match["player_slot"] < 120)
			match["items"] = items
			match["timestamp"] = datetime.fromtimestamp(match["start_time"])

			match = DotaMatch(**match)
			session.add(match)

		# Commit the changes to the database
		session.commit()
		print("Data inserted successfully.")
	
	except Exception as error:
		session.rollback()
		print("Error inserting data:", error)
	
	finally:
		session.close()


async def main():
	session = create_session(db_url)
	data = await fetch_data()
	print(f"{len(data)} Matches Fetched")
	insert_data(data, session)


if __name__ == "__main__":
	if config["DEBUG"] == "true": # need this for when we're debugging on windows
		asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
	asyncio.run(main())