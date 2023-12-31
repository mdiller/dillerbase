const express = require("express");
const path = require("path");
const fs = require("fs");
const weatherChart = require("./weatherChart");
const fetch = require("node-fetch");


const currentDirectory = path.dirname(__filename);
const parentDirectory = path.resolve(path.join(currentDirectory, '..'));
var configPath = path.join(parentDirectory, '.env');
const config = {};
var configText = fs.readFileSync(configPath, "utf8");
const lines = configText.split('\n');
for (const line of lines) {
	const match = line.match(/([^=]+)=(.+)/);
	if (match) {
		config[match[1]] = match[2];
	}
}


var LISTEN_PORT = config.SERVER_PORT;
console.log("Serving to: ", LISTEN_PORT);
const app = express();
app.listen(LISTEN_PORT);


var webCache = {};
var webCacheExpirations = {};
async function cachedWebRequest(url, expiration_hours, callback) {
	var now = new Date();
	if (url in webCacheExpirations && webCacheExpirations[url] < now) {
		delete webCache[url];
		delete webCacheExpirations[url];
	}
	if (url in webCache) {
		return webCache[url]
	}
	else {
		var response = await fetch(url);
		var data = await response.json();

		if (data.error) {
			throw new Error(`Weather API Error: ${data.reason}`);
		}

		webCache[url] = data;
		var expirationDate = new Date();
		expirationDate.setHours(expirationDate.getHours() + expiration_hours);
		webCacheExpirations[url] = expirationDate;

		return data;
	}
}

function isDateToday(date) {
	const today = new Date();
	// Compare the year, month, and day of the two dates
	return (
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate()
	);
}

async function getWeatherData(date, callback) {
	var dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
	var args = {
		latitude: config.SERVER_LAT,
		longitude: config.SERVER_LON,
		hourly: "temperature_2m,cloudcover,windspeed_10m,precipitation",
		temperature_unit: "fahrenheit",
		windspeed_unit: "mph",
		timezone: config.SERVER_TIMEZONE,
		start_date: dateString,
		end_date: dateString
	}
	var today = new Date();
	var recentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	recentDate.setMonth(recentDate.getMonth() - 1); // go back one month
	if (date >= recentDate) { // this is in future (or recent past) so use forecast api
		var args_string = Object.keys(args).map(key => `${key}=${args[key]}`).join("&");
		return await cachedWebRequest(`https://api.open-meteo.com/v1/forecast?${args_string}`, 1);
	}
	else { // this is in past so use archive api
		var args_string = Object.keys(args).map(key => `${key}=${args[key]}`).join("&");
		return await cachedWebRequest(`https://archive-api.open-meteo.com/v1/archive?${args_string}`, 24 * 7)
	}
}

// SQL query interface
app.use("/weather/:date", async (req, res) => {
	try {
		const dateString = req.params.date;
		const [year, month, day] = dateString.split('-').map(Number);
		const date = new Date(year, month - 1, day);

		var weatherData = await getWeatherData(date);

		weatherChart.generateWeatherSvg(weatherData, svg => {
			res.setHeader('Content-Type', 'image/svg+xml');
			res.status(200).send(svg);
		});
	}
	catch(err) {
		console.error(`Error on: ${req.baseUrl}`);
		console.error(err.message);
		console.error(err.stack);
		res.status(500).send(`Errored: ${err.message}`);
	}
});