const weatherChart = require("./weatherChart");
const fs = require("fs");

var weatherData = {"hourly_units":{"time":"iso8601","temperature_2m":"°F","cloudcover":"%","windspeed_10m":"mp/h"},"hourly":{"time":["2023-09-12T00:00","2023-09-12T01:00","2023-09-12T02:00","2023-09-12T03:00","2023-09-12T04:00","2023-09-12T05:00","2023-09-12T06:00","2023-09-12T07:00","2023-09-12T08:00","2023-09-12T09:00","2023-09-12T10:00","2023-09-12T11:00","2023-09-12T12:00","2023-09-12T13:00","2023-09-12T14:00","2023-09-12T15:00","2023-09-12T16:00","2023-09-12T17:00","2023-09-12T18:00","2023-09-12T19:00","2023-09-12T20:00","2023-09-12T21:00","2023-09-12T22:00","2023-09-12T23:00"],"temperature_2m":[60.4,60.5,58.6,58.6,57.7,55.9,54.2,52.8,55.1,59.3,64.8,68.1,71.2,73.9,76.2,77.5,77.7,77.3,75.8,73.8,66.3,60.9,55.7,42.8],"cloudcover":[100,6,1,1,1,33,12,29,43,8,17,53,20,26,100,100,100,91,97,85,98,47,9,8],"precipitation":[0.00,0.00,0.00,0.00,0.00,0.00,0.70,0.70,0.70,2.00,5.00,2.00,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.00,0.00,0.00],"windspeed_10m":[2.1,3.3,0.7,1.3,2.0,0.7,1.5,0.9,2.4,0.9,2.2,2.4,2.1,2.7,3.2,4.8,5.5,5.2,7.8,7.9,9.4,8.3,4.7,3.0]}}


console.log("generating...")
weatherChart.generateWeatherSvg(weatherData, svg => {
	fs.writeFileSync("../temp/out.svg", svg);
	console.log("Done!")
});