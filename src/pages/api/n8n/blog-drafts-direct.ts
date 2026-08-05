import { NextApiRequest, NextApiResponse } from 'next';

const N8N_BASE = 'https://n8n.tacit3d.com';
const WORKFLOW_ID = 'NX6rLh5j6aX1u2OZ';
const BASIC_AUTH = 'Basic bWVQZGk6VGVzdDEyMzQ=';
// New API key (updated Aug 2026)
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjg2Zjg0OS01NjU2LTQ0NjAtYWQ2NC0yZWU3YTY3ZTc4NGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjZhMWY1OTQtZjdlYy00MjdiLThiZTAtOTQwZjk0ZDc3NjRkIiwiaWF0IjoxNzg1ODM1ODMwfQ.hkRVCr3Pvoenq8UirWH_Nk3GBd1TAmipIUZ8BjC_EdU';

function getApiKey(): string {
  // Fallback hardcoded key in case env is not loaded yet
  const envKey = process.env.N8N_API_KEY;
  if (envKey && envKey.length > 10) return envKey;
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjg2Zjg0OS01NjU2LTQ0NjAtYWQ2NC0yZWU3YTY3ZTc4NGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYjZhMWY1OTQtZjdlYy00MjdiLThiZTAtOTQwZjk0ZDc3NjRkIiwiaWF0IjoxNzg1ODM1ODMwfQ.hkRVCr3Pvoenq8UirWH_Nk3GBd1TAmipIUZ8BjC_EdU';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return triggerGeneration(res);
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return getBlogDrafts(res);
}

async function getBlogDrafts(res: NextApiResponse) {
  const apiKey = N8N_API_KEY;
  const headers: Record<string, string> = {
    'X-N8N-API-KEY': apiKey,
    'Authorization': BASIC_AUTH,
    'Accept': 'application/json',
  };

  try {
    // Step 1: get last 50 executions
    const execsRes = await fetch(
      `${N8N_BASE}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=50`,
      { headers }
    );

    if (!execsRes.ok) {
      const errText = await execsRes.text();
      console.error('n8n executions API error:', execsRes.status, errText);
      return res.status(200).json({ error: 'api_error', detail: errText });
    }

    const execsData = await execsRes.json();
    const executions: any[] = execsData.data || [];

    // Step 2: find generation executions (duration > 5s = Claude generation)
    const generationExecs = executions.filter((e: any) => {
      if (e.status !== 'success' || !e.stoppedAt || !e.startedAt) return false;
      const ms = new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime();
      return ms > 5000;
    });

    if (generationExecs.length === 0) {
      return res.status(200).json({
        debug: 'no_generation_found',
        total_executions: executions.length,
        sample: executions.slice(0, 3).map((e: any) => ({
          id: e.id,
          status: e.status,
          duration: e.stoppedAt && e.startedAt
            ? new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()
            : null,
        })),
      });
    }

    // Step 3: get full data of most recent generation execution
    const lastGen = generationExecs[0];
    const execRes = await fetch(
      `${N8N_BASE}/api/v1/executions/${lastGen.id}?includeData=true`,
      { headers }
    );

    if (!execRes.ok) {
      return res.status(200).json({ error: 'exec_detail_error', id: lastGen.id });
    }

    const execDetail = await execRes.json();
    const runData = execDetail?.data?.resultData?.runData;

    if (!runData) {
      return res.status(200).json({ error: 'no_runData', id: lastGen.id });
    }

    const nodeNames = Object.keys(runData);
    console.log('Nodes in execution', lastGen.id, ':', nodeNames);

    const parseNodeData = runData['Parse Blog Outputs'];
    if (!parseNodeData) {
      return res.status(200).json({
        error: 'no_parse_node',
        available_nodes: nodeNames,
        execution_id: lastGen.id,
      });
    }

    const parseOutput = parseNodeData[0]?.data?.main?.[0]?.[0]?.json;
    if (!parseOutput) {
      return res.status(200).json({ error: 'no_parse_output', execution_id: lastGen.id });
    }

    if (!parseOutput.blogs || parseOutput.blogs.length === 0) {
      return res.status(200).json({ error: 'empty_blogs', execution_id: lastGen.id, parseOutput });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      weekId: parseOutput.weekId,
      status: parseOutput.status,
      blogs: parseOutput.blogs,
      generatedAt: parseOutput.generated_at,
      executionId: lastGen.id,
    });

  } catch (err: any) {
    console.error('blog-drafts-direct error:', err);
    return res.status(200).json({ error: 'exception', message: err.message });
  }
}

async function triggerGeneration(res: NextApiResponse) {
  try {
    const triggerRes = await fetch(`${N8N_BASE}/webhook/blog-run-now`, {
      method: 'POST',
      headers: {
        'Authorization': BASIC_AUTH,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Referer': 'http://159.223.183.169:7788/',
      },
      body: JSON.stringify({ trigger: 'manual', source: 'dashboard' }),
    });

    const text = await triggerRes.text();
    return res.status(200).json({ triggered: true, response: text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
