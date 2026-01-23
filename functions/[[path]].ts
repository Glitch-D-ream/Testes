import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { analysisController } from '../server/controllers/analysis.controller.js';

const app = new Hono().basePath('/api');
app.use('*', cors());
const adapt = (fn: any) => async (c: any) => {
  const body = c.req.method === 'POST' || c.req.method === 'PUT' ? await c.req.json().catch(() => ({})) : {};
  const req: any = { body, params: c.req.param(), query: c.req.query(), headers: c.req.header(), method: c.req.method, path: c.req.path, ip: c.req.header('cf-connecting-ip'), get: (name: string) => c.req.header(name) };
  let resData: any; let resStatus = 200; let resHeaders: Record<string, string> = {};
  const res: any = { status: (code: number) => { resStatus = code; return res; }, json: (data: any) => { resData = data; return res; }, send: (data: any) => { resData = data; return res; }, setHeader: (name: string, value: string) => { resHeaders[name] = value; return res; } };
  try { await fn(req, res); } catch (err: any) { return c.json({ error: 'Internal Server Error', message: err.message }, 500); }
  return c.json(resData, resStatus, resHeaders);
};
app.get('/health', (c) => c.json({ status: 'ok', platform: 'Cloudflare Pages' }));
app.post('/analyze', adapt(analysisController.create));
app.get('/analyze', adapt(analysisController.list));
app.get('/analyze/:id', adapt(analysisController.getById));
export const onRequest = handle(app);
