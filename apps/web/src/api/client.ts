const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? 'Request failed');
  return json.data;
}

export const api = {
  listRuns: () => request('/runs'),
  getRun: (runId: string) => request(`/runs/${runId}`),
  updateSelection: (runId: string, postIds: string[]) =>
    request(`/runs/${runId}/selection`, { method: 'PUT', body: JSON.stringify({ postIds }) }),
  generate: (runId: string) => request(`/runs/${runId}/generate`, { method: 'POST' }),
  patchDraft: (runId: string, markdown: string) =>
    request(`/runs/${runId}/draft`, { method: 'PATCH', body: JSON.stringify({ markdown }) }),
  publish: (runId: string) => request(`/runs/${runId}/publish`, { method: 'POST' })
};
