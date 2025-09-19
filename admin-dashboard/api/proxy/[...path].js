// Vercel Functions 프록시 - HTTP API를 HTTPS로 프록시

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  const url = `http://3.25.230.187/api/v1/${apiPath}`;

  try {
    const headers = { ...req.headers };
    delete headers.host; // 호스트 헤더 제거
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // GET이 아닌 경우 body 추가
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.text();

    // 응답 헤더 복사
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        responseHeaders[key] = value;
      }
    });

    res.status(response.status);
    Object.keys(responseHeaders).forEach(key => {
      res.setHeader(key, responseHeaders[key]);
    });

    // JSON 응답인 경우
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      // JSON이 아닌 경우 그대로 반환
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      url: url 
    });
  }
}