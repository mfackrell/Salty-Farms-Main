import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api/client';
import { useDebouncedAutosave } from '../hooks/useDebouncedAutosave';
import { RunDetail } from '../types';

export function RunDetailPage() {
  const { runId = '' } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['run', runId], queryFn: () => api.getRun(runId), enabled: !!runId });
  const detail = data as RunDetail | undefined;

  const [selected, setSelected] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState('');

  const selectedIds = useMemo(() => selected.length ? selected : (detail?.run.selections.map((s) => s.post.id) ?? []), [selected, detail]);

  const saveMutation = useMutation({ mutationFn: (next: string) => api.patchDraft(runId, next) });
  useDebouncedAutosave(markdown, useCallback((next) => {
    saveMutation.mutate(next);
  }, [saveMutation]), 5000);

  const selectionMutation = useMutation({
    mutationFn: (postIds: string[]) => api.updateSelection(runId, postIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['run', runId] })
  });
  const generateMutation = useMutation({ mutationFn: () => api.generate(runId), onSuccess: () => qc.invalidateQueries({ queryKey: ['run', runId] }) });
  const publishMutation = useMutation({ mutationFn: () => api.publish(runId), onSuccess: () => qc.invalidateQueries({ queryKey: ['run', runId] }) });

  const currentMarkdown = markdown || detail?.run.draft?.markdown || '';

  return (
    <div className="layout">
      <section>
        <h2>Posts</h2>
        {detail?.posts.map((post) => (
          <label key={post.id} className="post-item">
            <input
              type="checkbox"
              checked={selectedIds.includes(post.id)}
              onChange={(e) => setSelected((prev) => e.target.checked ? [...new Set([...prev, post.id])] : prev.filter((id) => id !== post.id))}
            />
            {post.message}
          </label>
        ))}
        <button onClick={() => selectionMutation.mutate(selectedIds)}>Save Selection</button>
        <button onClick={() => generateMutation.mutate()} disabled={selectedIds.length === 0}>Generate Draft</button>
        <button onClick={() => publishMutation.mutate()} disabled={detail?.run.status !== 'DRAFT_READY'}>Publish</button>
      </section>

      <section>
        <h2>Markdown Editor</h2>
        <textarea value={currentMarkdown} onChange={(e) => setMarkdown(e.target.value)} rows={30} />
      </section>

      <section>
        <h2>Live Preview</h2>
        <ReactMarkdown>{currentMarkdown}</ReactMarkdown>
        <h3>Generated Sections</h3>
        {detail?.run.sections.map((s) => <pre key={s.id}>{s.type}: {s.contentMarkdown}</pre>)}
      </section>
    </div>
  );
}
