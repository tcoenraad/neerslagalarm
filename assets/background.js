  chrome.extension.onRequest.addListener(
    function() {
      cache = [];
  });

  $(function() {
    get_location();

    setInterval(function() {
      get_location();
    }, 1000 * 60);
  });