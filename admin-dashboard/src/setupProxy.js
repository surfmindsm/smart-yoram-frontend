const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🚀 Setting up proxy middleware...');
  
  // API 프록시 설정
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
        console.log(`✅ Proxy response: ${proxyRes.statusCode} from ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
      }
    })
  );
};
