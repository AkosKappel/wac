// in a file, not inline, because the Content-Security-Policy allows scripts from 'self' only
window.ui = SwaggerUIBundle({
  url: '/api/openapi',
  dom_id: '#swagger-ui',
  deepLinking: true,
});
