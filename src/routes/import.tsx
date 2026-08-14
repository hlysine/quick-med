import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { downloadLocalData, importLocalData } from '../utils/quickTransfer';

interface ImportSearch {
  id: string;
}

function ImportPage() {
  const { id } = useSearch({ from: '/import' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) {
        setError('No transfer ID was provided in the link.');
        return;
      }
      try {
        const data = await downloadLocalData(id);
        importLocalData(data);
        // Full page refresh so the app reloads with the imported data
        window.location.replace('/');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to import data.');
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-bold">Import failed</h1>
          <p className="text-error">{error}</p>
          <a className="btn" href="/">
            Go to home page
          </a>
        </>
      ) : (
        <>
          <span className="loading loading-spinner loading-lg" />
          <p>Importing your data…</p>
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute('/import')({
  validateSearch: (search: Record<string, unknown>): ImportSearch => ({
    id: typeof search.id === 'string' ? search.id : '',
  }),
  component: ImportPage,
});
