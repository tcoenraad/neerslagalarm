  chrome.extension.sendRequest({ reset: true });

  function setup_graph() {
    $('#loader').show();

    chart_data = new google.visualization.DataTable();

    chart_data.addColumn('string', 'datetime');
    chart_data.addColumn('number', 'lichte neerslag');
    chart_data.addColumn('number', 'matige neerslag');
    chart_data.addColumn('number', 'zware neerslag');
    chart_data.addColumn('number', 'mm/u');

    get_location(fill_graph, true, chart_data);
  }

  function fill_graph(title, chart_data) {
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
    chart.draw(chart_data, options);

    d = new Date(parseInt(localStorage['lastUpdateAt']));
    leadingZeroHours = (d.getHours() < 9) ? '0' : '';
    leadingZeroMin = (d.getMinutes() < 9) ? '0' : '';
    $('#refresh').text('laatste update: '+ leadingZeroHours + d.getHours() + ':' + leadingZeroMin + d.getMinutes()); 

    $('#loader').hide();
  }

  google.load('visualization', '1.0', { 'packages': ['corechart']} );
  google.setOnLoadCallback(function() {
    $(function() {
      setup_graph();

      $('#refresh').click(function(e){
        e.preventDefault();
        setup_graph();
      });

      setInterval(function() {
        setup_graph();
      }, 1000 * 60);
    });
  });
