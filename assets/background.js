  chrome.extension.onRequest.addListener(
    function() {
      cache = [];
  });

  $(function() {
    getLocation();

    setInterval(function() {
      getLocation();
    }, 1000 * 60);
  });