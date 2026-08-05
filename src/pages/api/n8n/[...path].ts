import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path, ...queryParams } = req.query;
  
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const n8nPath = path.join('/');
  let n8nUrl = `https://n8n.tacit3d.com/webhook/${n8nPath}`;
  
  // Reconstruct query string
  const queryStr = new URLSearchParams(queryParams as Record<string, string>).toString();
  if (queryStr) {
    n8nUrl += `?${queryStr}`;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      // Simuler le navigateur exact et l'origine attendus par le WAF
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': 'http://159.223.183.169:7788/',
      // Injection de l'authentification Nginx Basic extraite depuis vos logs N8N
      'Authorization': 'Basic bWVQZGk6VGVzdDEyMzQ='
    };

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(n8nUrl, options);
    
    const contentType = response.headers.get('content-type');
    
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (contentType && contentType.includes('application/json')) {
      // Read as text first to handle empty bodies (n8n can return 200 with empty body)
      const text = await response.text();
      if (!text || !text.trim()) {
        return res.status(response.status).send('');
      }
      try {
        const data = JSON.parse(text);
        return res.status(response.status).json(data);
      } catch {
        // Not valid JSON despite content-type header — send as-is
        return res.status(response.status).send(text);
      }
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error: any) {
    console.error('N8N Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to proxy request to n8n', details: error.message });
  }
}
