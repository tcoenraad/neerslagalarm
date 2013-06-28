  chrome.extension.sendRequest({ reset: true });

  function displayWeatherPrepare() {
    //visual feedback
    $('#loader').show();

    chartData = new google.visualization.DataTable();

    chartData.addColumn('string', 'datetime');
    chartData.addColumn('number', 'lichte neerslag');
    chartData.addColumn('number', 'matige neerslag');
    chartData.addColumn('number', 'zware neerslag');
    chartData.addColumn('number', 'mm/u');

    getLocation(displayWeather, true, chartData);
  }

  function displayWeather(title, chartData) {
    //set forecast
    $('#title').text(title);
  
    options = {
      width: '450',
      height: '225',
      chartArea: { width: "85%", height: 175, top: "10%" },

      hAxis: { showTextEvery: 12 },
      vAxis: { maxValue: 12 },

      legend: 'none',

      backgroundColor: '#f0f0f0',
      colors: ['#ddd', '#ddd', '#ddd', '#3366cc'],
    };

    chart = new google.visualization.AreaChart(document.getElementById('chart'));
    chart.draw(chartData, options);

    d = new Date(parseInt(localStorage['lastUpdateAt']));
    leadingZeroHours = (d.getHours() < 9) ? '0' : '';
    leadingZeroMin = (d.getMinutes() < 9) ? '0' : '';
    $('#refresh').text('laatste update: '+ leadingZeroHours + d.getHours() + ':' + leadingZeroMin + d.getMinutes()); 

    //end visual feedback
    $('#loader').hide();
  }

  google.load('visualization', '1.0', { 'packages': ['corechart']} );
  google.setOnLoadCallback(function() {
    $(function() {
      displayWeatherPrepare();

      $('#refresh').click(function(e){
        e.preventDefault();
        displayWeatherPrepare();
      });

      setInterval(function() {
        displayWeatherPrepare();
      }, 1000 * 60);
    });
  });
  