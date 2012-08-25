var cache = []
var weatherData;
var lon, lat;

var lastUpdateAt, lastNotificationAt;
var firstRainAt, noRainAt;
var firstRain, noRain;

var weatherImages = {
	'clear': '32.png',
	'cloudy': '26.png',
	'flurries': '18.png',
	'fog': '20.png',
	'hazy': '22.png',
	'mostlycloudy': '28.png',
	'mostlysunny': '30.png',
	'partlycloudy': '28.png',
	'partlysunny': '30.png',
	'rain': '01.png',
	'sleet': '18.png',
	'snow': '16.png',
	'sunny': '36.png',
	'tstorms': '03.png',
	'unknown': '44.png',
};

function calcTimes(tijdstip) {
	splitData = tijdstip.split(':');
	hours = parseInt(splitData[0]);
	minutes = parseInt(splitData[1]);

	d = new Date();
	t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes);

	//next day fix, for a two hour graph
	if(hours <= 1 && d.getHours() >= 22) {
		t.setTime(t.getTime() + 86400000);
	}
	if(hours == 23 && d.getHours() == 0) {
		t.setTime(t.getTime() - 86400000);
	}

	timeOffset = t.getTime() - d.getTime();
	minutesOffset = Math.round(timeOffset / 60 / 1000); //this can be negative, as buienradar.nl is 10m behind realtime
	
	minutesToRain = minutesOffset;
	hoursToRain = 0;

	if(minutesToRain >= 60) {
		hoursToRain = Math.floor(minutesToRain / 60);
		minutesToRain = minutesToRain - hoursToRain * 60;
	}

	return [ minutesOffset, minutesToRain, hoursToRain ];
}

function geocode(data) {
	//caching results
	if(data) {
		cache['geocode'] = data;
	}

	if(cache['geocode']['status'] != 'ZERO_RESULTS') {
		//making sure a city name is displayed
		i = 0;
		while(cache['geocode']['results'][0]['address_components'][i]['types'][0] != 'locality') {
			i++;

			//there's probably some error
			if(i > 10) {
				break;
			}
		}
		$('#location').text(cache['geocode']['results'][0]['address_components'][i]['long_name']);
	} else {
		$('#location').text('onbekend');
	}
}

function wunderground(data) {
	//caching results
	if(data) {
		cache['wunderground'] = data;
	}

	//set temp
	$('#degrees').text($(cache['wunderground']).find('temp_c').text());

	//set img
	src = ($(cache['wunderground']).find('icon').text()) ? weatherImages[$(cache['wunderground']).find('icon').text()] : weatherImages['unknown'];
	$('#weatherImg').attr('src', 'assets/' + src);
}

function buienradar(callback, display, chartData, data) {
	//caching results
	if(data) {
		cache['buienradar'] = data;
	}

	//initialize/reset these values
	weatherData = {};
	firstRainAt = null;
	noRainAt = null;
	firstRain = null;
	noRain = null;

  firstRainBadgeAt = null;
	noRainBadgeAt = null;
	firstRainBadge = null;
	noRainBadge = null;

	//split datafeed into array, every single line an entry
	splitLines = cache['buienradar'].split("\n");
	splitLines.pop(); //last result is empty

	//preparing an array with key time and value neerslag
	$.each(splitLines, function(key, value) {
		values = value.split('|');
		time = values[1];

		neerslag = Math.pow(10, (values[0] - 109) / 32);
		neerslag = Math.round(neerslag * 10) / 10;
		weatherData[time] = neerslag; 
	});

	//if it doesn't stop raining, latest value is for badge
  i = 0;
  maxI = 25;
	for (var prop in weatherData) {
    i++;

		tijdstip = prop;
		neerslag = weatherData[prop];

		//skipping empty results, just in case, shouldn't happen
		if(tijdstip == 'undefined') {
			continue;
		}

		//first rain to fall
		if(neerslag > 0 //it isn't dry
		&& calcTimes(tijdstip)[0] >= -5 //time is now or in the future, not in past
		&& !firstRainAt) { //not set yet
			firstRainAt = tijdstip; //this is the firstRain, any further attempt can't be the first
		}

   	if(neerslag > localStorage['badgeAmount'] //it isn't dry
		&& calcTimes(tijdstip)[0] >= -5 //time is now or in the future, not in past
		&& !firstRainBadgeAt) { //not set yet
			firstRainBadgeAt = tijdstip; //this is the firstRain, any further attempt can't be the first
		}

		if(!noRainAt //not set yet
 		&& firstRainAt //some rain has fallen
		&&
      ((calcTimes(tijdstip)[0] >= -5 //time is now or in the future, not in past
      && neerslag == 0)
      ||
      i == maxI)
    ) { //it is dry
			noRainAt = tijdstip;
		}

    if(!noRainBadgeAt //not set yet
 		&& firstRainBadgeAt //some rain has fallen
		&& 
      ((calcTimes(tijdstip)[0] >= -5 //time is now or in the future, not in pasts
      && neerslag <= localStorage['badgeAmount'])
      ||
      i == maxI)
    ) { //it is dry
			noRainBadgeAt = tijdstip;
		}

		//fill graph
		if(display) {
			chartData.addRow([tijdstip, 0.5, 3, 12, neerslag]);
		}
	}

	if(firstRainAt) {
		firstRain = calcTimes(firstRainAt);
	}
	if(firstRainBadgeAt) {
		firstRainBadge = calcTimes(firstRainBadgeAt);
	}
	if(noRainAt) {
		noRain = calcTimes(noRainAt);
		noRain[3] = noRain[0] - firstRain[0];
	}
	if(noRainBadgeAt) {
		noRainBadge = calcTimes(noRainBadgeAt);
		noRainBadge[3] = noRainBadge[0] - firstRainBadge[0];
	}

	//make sure this is a number
	if(!localStorage['lastNotificationAt']) {
		localStorage['lastNotificationAt'] = 0;
	}
	//set default interval if not set
	if(!localStorage['notificationInterval']) {
		localStorage['notificationInterval'] = 60;
	}

	//precipation in x minutes and last 60 minutes no notification given
	if(!display && //not manually invoked
		localStorage['notification'] //notification enabled
		&& minutesOffset <= localStorage['notificationInterval'] //interval check
		&& neerslag >= localStorage['notificationAmount'] //precipation amount check
		&& (parseInt(localStorage['lastNotificationAt']) + 1000 * 60 * 60) < Date.now()) { //30 minutes no notification
		localStorage['lastNotificationAt'] = Date.now();

		notification = webkitNotifications.createNotification(
			'icon128.png',
			'Neerslagalarm',
			title
		);
		notification.show();

		setTimeout(function() {
			notification.cancel();
		}, 10 * 1000);
	}

	if(firstRain) {
		//shorthands
		minutesToRain = (firstRain[1] < 0) ? 0 : firstRain[1];
		hoursToRain = firstRain[2];

		//string for notification and popup
		title = 'neerslag verwacht over ' + String.fromCharCode(177) + ' ';
		title += (hoursToRain) ? hoursToRain + ' uur en ' : '';

		title += minutesToRain + ' ';
		title += (minutesToRain != 1) ? 'minuten' : 'minuut';

		if(noRain) {
			title += (noRain[3]) ? ' (+' + (noRain[3]) + ' m)' : '';
		}
	} else {
		if(display) {
			title = 'geen neerslag verwacht';
		}
	}

  if(firstRainBadge) {
    if(firstRainBadge[1] <= 0 && firstRainBadge[2] == 0) { //raining right now
			chrome.browserAction.setBadgeText({text: '+' + noRainBadge[3]});
    } else { //it will rain in some time
      chrome.browserAction.setBadgeText({text: firstRainBadge[0] + 'm'});
    }  
  } else {
    chrome.browserAction.setBadgeText({text: ''});
  }


	if(callback) {
		//and go back
		callback(title, chartData);
	}
}

//function to callback, option whether data will be displayed, pointer to chartData
function getLocation(callback, display, chartData) {
	//get location
	if(localStorage['location'] == 'geolocation' || !localStorage['location']) {
		navigator.geolocation.getCurrentPosition( //async
			function (position) {
				lat = position.coords.latitude;
				lon = position.coords.longitude;

				updateWeatherData(callback, display, chartData);
			}
		);
	}
	else {
		lat = localStorage['position-lat'];
		lon = localStorage['position-lon'];

		updateWeatherData(callback, display, chartData);
	}
}

//function to callback, option to display, pointer to chartData
function updateWeatherData(callback, display, chartData) {
	//update if last update was x minutes ago
	forceUpdate = (!cache['buienradar'] || Date.now() - localStorage['lastUpdateAt'] > 1000 * 60 * 5) ? true : false;

	//lat, lon in global
	if(forceUpdate) {
		//set lastUpdateAt time to this moment
		localStorage['lastUpdateAt'] = Date.now();

		if(display) {
			$.getJSON('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon + '&sensor=false', function(data) { geocode(data) });
			$.get('http://api.wunderground.com/auto/wui/geo/WXCurrentObXML/index.xml?query=' + lat + ',' + lon, function(data) { wunderground(data) });
		}
		$.get('http://gps.buienradar.nl/getrr.php?lat=' + lat + '&lon=' + lon, function(data) { buienradar(callback, display, chartData, data) });
	} else {
		if(display) {
			geocode();
			wunderground();
		}
		buienradar(callback, display, chartData);
	}
}