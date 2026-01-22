import { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.status(200).json({
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query,
    env_keys: Object.keys(process.env).filter(k => k.includes('TELEGRAM') || k.includes('URL') || k.includes('DOMAIN'))
  });
}
