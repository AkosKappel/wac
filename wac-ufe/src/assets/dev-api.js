// `npm start` dev server has no /api proxy; call the mock API directly.
// A separate file, not an inline script, so the Content-Security-Policy can forbid inline scripts.
// Stencil takes the next free port when 3333 is busy.
if (/^33[3-9][0-9]$/.test(location.port)) {
  document.querySelector('harkap-ambulance-wl-app').setAttribute('api-base', 'http://localhost:5555/api');
}
