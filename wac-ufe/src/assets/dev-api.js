// `npm start` dev server has no /api proxy; call the mock API directly.
// A separate file, not an inline script, so the Content-Security-Policy can forbid inline scripts.
if (location.port === '3333') {
  document.querySelector('harkap-ambulance-wl-app').setAttribute('api-base', 'http://localhost:5555/api');
}
