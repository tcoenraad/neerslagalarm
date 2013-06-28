  var previousMarker, t, map;

  function setNewMarker(position, map) {
    if(previousMarker) {
      previousMarker.setMap(null);
    }

    marker = new google.maps.Marker({
      position: new google.maps.LatLng(position[0], position[1]),
      map: map,
      title: 'manual'
    });
    previousMarker = marker; //pointer to reset on next setter
  }

  $(function() {
    //default map, Netherlands
    latLng = new google.maps.LatLng(52.133488040771496, 5.29541015625); //Netherlands
    options = {
      zoom: 7,
      center: latLng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    map = new google.maps.Map(document.getElementById('map'), options);

    //restore saved marker
    if(localStorage['position-lat']) {
      setNewMarker([localStorage['position-lat'], localStorage['position-lon']], map);
      map.setCenter(new google.maps.LatLng(localStorage['position-lat'], localStorage['position-lon']));
    }

    navigator.geolocation.getCurrentPosition( //async
      function (position) {
        lat = position.coords.latitude;
        lon = position.coords.longitude;

        geoMarker = new google.maps.Marker({
          position: new google.maps.LatLng(lat, lon),
          map: map,
          title: 'auto-geo'
        });
      }
    );

    //restore saved states
    if(localStorage['location'] == 'manual') {
      $('input[name=location]:eq(1)').attr('checked', true);
    }
    if(localStorage['notification'] == 'false') { //localstorage makes this a string, shortest fix
      $('#form-notification').attr('checked', false);
    }
    if(localStorage['notificationInterval']) {
      $('select[name=notificationInterval] [value="' + localStorage['notificationInterval'] + '"]').attr('selected', true);
    }
    if(localStorage['notificationAmount']) {
      $('select[name=notificationAmount] [value="' + localStorage['notificationAmount'] + '"]').attr('selected', true);
    }
    if(localStorage['badgeAmount']) {
      $('select[name=badgeAmount] [value="' + localStorage['badgeAmount'] + '"]').attr('selected', true);
    }

    //restore geo values
    if(localStorage['position-lat']) {
      $('#lat').val(localStorage['position-lat']);
      $('#lon').val(localStorage['position-lon']);
    }

    google.maps.event.addDomListener(map, 'mousedown', function(e) {
      t = setTimeout(function(){
        //fill those forms
        lat = e.latLng.lat();
        lon = e.latLng.lng(); //lng, not lon

        $('#lat').val(lat);
        $('#lon').val(lon);

        //give a visible respons
        setNewMarker([lat, lon], map);
        map.panTo(new google.maps.LatLng(lat, lon));
      }, 500);
    });
    google.maps.event.addDomListener(map, 'mouseup', function(e) {
      clearTimeout(t);
    });

    //event handlers
    $('#save').click(function() {
      localStorage['location'] = $('input[name=location]:checked').val();
      localStorage['notification'] = $('#form-notification').is(':checked');
      localStorage['notificationInterval'] = $('select[name=notificationInterval] option:selected').val();
      localStorage['notificationAmount'] = $('select[name=notificationAmount] option:selected').val();
      localStorage['badgeAmount'] = $('select[name=badgeAmount] option:selected').val();

      localStorage['position-lat'] = $('#lat').val();
      localStorage['position-lon'] = $('#lon').val();

      //reset caches
      chrome.extension.sendRequest({ reset: true });
      cache = [];

      //and do it again
      getLocation();

      $('#status').text('Opgeslagen!').show();
      setTimeout(function() {
        $('#status').hide();
      }, 3000);
    });
  });
