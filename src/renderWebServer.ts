import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';

function sendText(req: IncomingMessage, res: ServerResponse, statusCode: number, body: string): void {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

export function startRenderWebServer(): Server {
  const port = Number(process.env.PORT || 3000);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const path = req.url?.split('?')[0] || '/';

    if ((req.method === 'GET' || req.method === 'HEAD') && (path === '/health' || path === '/healthz')) {
      sendText(req, res, 200, 'ok');
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && path === '/') {
      sendText(req, res, 200, 'App is running');
      return;
    }

    sendText(req, res, 404, 'Not found');
  });

  server.on('error', (error) => {
    console.error('[Render Web] Failed to start web server:', error);
    process.exit(1);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Render Web] Health server listening on port ${port}`);
  });
  return server;
}
