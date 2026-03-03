import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RunDetailPage } from './RunDetailPage';

vi.mock('../api/client', () => ({
  api: {
    getRun: vi.fn().mockResolvedValue({
      run: { id: 'r1', status: 'SELECTING', selections: [], sections: [], draft: null },
      posts: [{ id: 'p1', externalPostId: 'x', message: 'Post one', postedAt: '' }]
    }),
    patchDraft: vi.fn(),
    updateSelection: vi.fn(),
    generate: vi.fn(),
    publish: vi.fn()
  }
}));

describe('RunDetailPage', () => {
  it('renders posts and disabled generate without selection', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/runs/r1']}>
          <Routes>
            <Route path="/runs/:runId" element={<RunDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Post one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate draft/i })).toBeDisabled();
  });
});
