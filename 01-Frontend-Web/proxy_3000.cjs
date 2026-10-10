const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 5173,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:5173' }
  };
  const proxy = http.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(res, { end: true });
  });
  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: ' + err.message);
  });
  req.pipe(proxy, { end: true });
});

server.listen(3000, '::', () => {
  console.log('Dual-stack port 3000 active and forwarding to 5173');
});
