const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🚀 Proxy middleware disabled - using direct API calls');
  
  // 프록시 비활성화 - 운영 서버 직접 호출
  /*
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api.surfmind-team.com',
      changeOrigin: true,
      secure: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '/api' // /api -> /api (그대로 유지)
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`✅ Proxying: ${req.method} ${req.url} -> https://api.surfmind-team.com${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`📨 Response: ${proxyRes.statusCode} for ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error(`❌ Proxy Error for ${req.url}:`, err.message);
      }
    })
  );
  */
};
