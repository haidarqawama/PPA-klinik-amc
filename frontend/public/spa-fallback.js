// SPA fallback for Capacitor WebView
(function() {
  // Fix navigations that go to 404
  var baseUrl = window.location.origin;
  var currentPath = window.location.pathname;

  // If we're on a 404 page, redirect to index.html with the path
  if (document.title.includes("404") || document.title.includes("not found")) {
    // Store the original path and reload from root
    sessionStorage.setItem('spaPath', currentPath);
    window.location.replace(baseUrl + '/index.html');
  }

  // After index.html loads, restore the path
  var savedPath = sessionStorage.getItem('spaPath');
  if (savedPath && currentPath === '/index.html') {
    sessionStorage.removeItem('spaPath');
    // Update the URL without reloading
    window.history.replaceState(null, '', savedPath);
  }
})();
