import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function naverApiPlugin(): Plugin {
  return {
    name: 'naver-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/update', async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule('/api/update.ts');
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            let parsedBody = {};
            if (body) {
              try {
                parsedBody = JSON.parse(body);
              } catch {
                parsedBody = {};
              }
            }

            const mockReq = {
              method: req.method,
              body: parsedBody,
              query: Object.fromEntries(new URL(req.url || '', 'http://localhost').searchParams)
            };

            const mockRes = {
              setHeader(k: string, v: string) {
                res.setHeader(k, v);
              },
              status(code: number) {
                res.statusCode = code;
                return {
                  json(data: any) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify(data));
                  },
                  end() {
                    res.end();
                  }
                };
              }
            };

            await handler(mockReq, mockRes);
          });
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), naverApiPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
