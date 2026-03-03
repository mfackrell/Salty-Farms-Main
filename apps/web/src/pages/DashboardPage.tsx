import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Run } from '../types';

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['runs'], queryFn: api.listRuns });

  if (isLoading) return <p>Loading...</p>;

  return (
    <main className="container">
      <h1>Newsletter Runs</h1>
      <ul>
        {(data as Run[]).map((run) => (
          <li key={run.id}>
            <Link to={`/runs/${run.id}`}>{run.month}</Link> - {run.status}
          </li>
        ))}
      </ul>
    </main>
  );
}
