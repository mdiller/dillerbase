const Chartist    = require('chartist');
const chartistSvg = require('chartist-svg');
const chartistSvgPlugin = require('chartist-plugin-pointlabels');
const fs = require("fs");


// const utils = require('@dillerm/webutils/src/utils.js');
// import * as utils from "./utils.js";
function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}

function rgbToHex(rgb) {
	function componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	return "#" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

// gradient is an array of colors representing the gradient. ie: [ "#ff0000", "#00ff00", "#0000ff" ]
function getColorFromGradient(percent, gradient) {
	if (typeof gradient === 'string') {
		gradient = [ gradient ];
	}
	if (gradient.length == 1) {
		gradient = [ gradient[0], gradient[0] ]
	}
	if (percent > 1) {
		percent = 1;
	}
	if (percent < 0) {
		percent = 0;
	}
	var index = Math.floor((percent * (gradient.length - 1)) - 0.0001);
	if (index < 0) {
		index = 0;
	}
	var min_color_rgb = hexToRgb(gradient[index]);
	var max_color_rgb = hexToRgb(gradient[index + 1]);
	var adjusted_percent = (percent - index * (1 / (gradient.length - 1))) * (gradient.length - 1);

	var color = {
		r: parseInt((max_color_rgb.r * adjusted_percent) + (min_color_rgb.r * (1 - adjusted_percent))),
		g: parseInt((max_color_rgb.g * adjusted_percent) + (min_color_rgb.g * (1 - adjusted_percent))),
		b: parseInt((max_color_rgb.b * adjusted_percent) + (min_color_rgb.b * (1 - adjusted_percent))),
	}
	return rgbToHex(color);
}

class ColorGradient {
	constructor(colors) {
		this.colors = colors;
	}

	getColor(percent) {
		return getColorFromGradient(percent, this.colors);
	}
}

// END OF IMPORT STUFF  


var temperatureGradient = new ColorGradient([ "#0000ff", "#FFA500", "#ff0000" ]);
function getTemperatureColor(temp) {
	var percent = ((temp - 50) / 40);
	return temperatureGradient.getColor(percent);
}

function createLinearGradient(colors) {
	// mostly copied from https://stackoverflow.com/questions/13760299/dynamic-svg-linear-gradient-when-using-javascript
	var svgns = "http://www.w3.org/2000/svg";

	var svg = document.createElementNS(svgns, "svg");
	var defs = document.createElementNS(svgns, "defs");
	var gradient = document.createElementNS(svgns, "linearGradient");
	var rect = document.createElementNS(svgns, "rect");

	// Parses an array of stop information and appends <stop> elements to the <linearGradient>
	for (var i = 0; i < colors.length; i++) {
		var color = colors[i];
		var offset = Math.round(100 * (i / (colors.length - 1)))
		// Create a <stop> element and set its offset based on the position of the for loop.
		var stop = document.createElementNS(svgns, "stop");
		stop.setAttribute("offset", `${offset}%`);
		stop.setAttribute("stop-color", color);

		// Add the stop to the <lineargradient> element.
		gradient.appendChild(stop);

	}

	// Apply the <lineargradient> to <defs>
	gradient.id = "lineGradient";
	gradient.setAttribute("x1", "0%");
	gradient.setAttribute("x2", "100%");
	gradient.setAttribute("y1", "0%");
	gradient.setAttribute("y2", "0%");
	defs.appendChild(gradient);

	// console.log(defs);
	// svgElement.appendChild(defs);
	return defs;
}

function ctDillerThing(options) {
	return function ctDillerThing(chart) {
		var defaultOptions = {
			show: true,
		};

		options = Chartist.extend({}, defaultOptions, options);
		var date = new Date();

		if(true) { // chart instanceof Chartist.Line

			var position = {
				x_p1: 0,
				x_p2: 0,
				x_start: 0,
				colors: []
			}

			chart.on('draw', function (data) {
				// console.log(data.type)
				if (data.type === 'point') {
					if (data.index == 0) {
						position.x_p1 = data.x;
					}
					if (data.index == 1) {
						position.x_p2 = data.x;
					}
					if (data.index == date.getHours()) {
						position.x_start = data.x;
					}
					// console.log(data);
					var color = getTemperatureColor(data.value.y);
					position.colors.push(color);
					data.element._node.style.stroke = color;
				}
			});

			chart.on('created', function (data) {
				position.x = position.x_start + ((position.x_p2 - position.x_p1) * (date.getMinutes() / 60.0));
				chart.svg.elem('line', {
					x1: position.x,
					x2: position.x,
					y1: data.chartRect.y1,
					y2: data.chartRect.y2
				}, "ct-vline");
				// [ "#ff0000", "#00ff00", "#0000ff" ]
			});
		}
	}
}

// var temperature_data = [	63.4, 62.2, 61.2, 60.5, 58.7, 57.1, 56.8, 56.0, 57.6, 61.8, 66.4, 69.7, 72.5, 74.7, 76.4, 77.1, 77.4, 77.7, 77.0, 73.7, 70.5, 66.7, 64.0, 62.9];



function generateWeatherSvg(weatherData, returnFunc) {
	var data = {
		labels: ["12am", null, null, null, null, null, "6am", null, "8am", null, "10am", null, "12am", null, "2pm", null, "4pm", null, "6pm", null, "8pm", null, null, "11pm"],
		series: [
			weatherData.hourly.temperature_2m,
		]
	};

	var options = {
		width: 900,
		height: 200,
		chartPadding: {
			right: 40,
			left: 0,
			bottom: 0,
			top: 10,
		},
		fullWidth: true,
		axisX: {
			labelOffset: {
				x: -15,
				y: 0
			},
		},
		axisY: {
			type: Chartist.FixedScaleAxis,
			ticks: [40, 50, 60, 70, 80, 90],
			low: 40,
			showLabel: false,
			high: 90
		},
		plugins: [
			Chartist.plugins.ctPointLabels({
				textAnchor: 'middle',
				labelInterpolationFnc: function(value) {return Math.round(value)}
			}),
			ctDillerThing({
				show: false
			})
		]
	};

	options = {
		css: fs.readFileSync("chartStyle.css"),
		chart: options
	}


	chartistSvg('line', data, options).then(svg => {
		svg = svg.replaceAll('xmlns="http://www.w3.org/2000/xmlns/"', "");
		svg = svg.replace('<svg xmlns:ct', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:ct');
		svg = svg.replaceAll('<span ', '<xhtml:span ');
		svg = svg.replaceAll('</span>', '</xhtml:span>');

		svg = svg.replace('height="264"', 'height="240"');

		
		var defsElement = createLinearGradient(weatherData.hourly.temperature_2m.map(getTemperatureColor));
		var defsText = defsElement.outerHTML;

		svg = svg.replace('class="ct-chart-line">', 'class="ct-chart-line">' + defsText);

		returnFunc(svg);
	});

}

module.exports = {
	generateWeatherSvg: generateWeatherSvg
};