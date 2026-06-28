import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Suspense,
  use,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FaSearch } from 'react-icons/fa';
import MouseDownLink from '../components/MouseDownLink';
import debounce from 'lodash/debounce';
import type { PageResult } from './-search';

function SearchResults({ results }: { results: PageResult[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    getItemKey: index => results[index].id,
    estimateSize: index => (results[index].preview.length > 0 ? 89 : 69),
    overscan: 3,
  });

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto pb-4 w-full">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const result = results[virtualRow.index];
          return (
            <MouseDownLink
              to={result.link}
              preload="intent"
              key={result.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex flex-col gap-1 w-96 bg-base-200 text-base border-b border-neutral/30 py-3 px-6 hover:bg-base-300 transition-all cursor-pointer"
            >
              <div className="breadcrumbs text-xs py-0 opacity-60">
                <ul>
                  <li className="capitalize">{result.id.split('/')[0]}</li>
                  <li>{result.section}</li>
                </ul>
              </div>
              {result.title}
              {result.preview.length > 0 ? (
                <div className="opacity-60 text-xs max-h-6 text-ellipsis overflow-hidden whitespace-nowrap">
                  {result.preview}
                </div>
              ) : null}
            </MouseDownLink>
          );
        })}
      </div>
    </div>
  );
}

let savedQuery = '';

const searchPromise = new Promise(resolve => setTimeout(resolve, 0))
  .then(() => import('./-search'))
  .then(mod => mod.search);

function Search({
  query,
  ref,
}: {
  query: string;
  ref?: React.Ref<{ navigate: () => Promise<void> }>;
}) {
  const search = use(searchPromise);
  const navigate = useNavigate();
  const results = useMemo(() => {
    return search(query);
  }, [query, search]);
  useImperativeHandle(ref, () => ({
    navigate: async () => {
      if (results.length === 0) return;
      await navigate({
        to: results[0].link,
      });
    },
  }));

  return <SearchResults results={results} />;
}

function SearchPage() {
  const [query, setQuery] = useState(savedQuery);
  const navigateRef = useRef<{ navigate: () => Promise<void> }>(null);

  const debounceInput = useMemo(
    () =>
      debounce(
        (value: string) => {
          setQuery(value);
        },
        10,
        { leading: false, trailing: true }
      ),
    []
  );
  useEffect(() => {
    savedQuery = query;
  }, [query]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 w-full mt-2 max-w-250 self-center">
      <label className="input w-full max-w-100">
        <FaSearch />
        <input
          type="search"
          className="grow"
          placeholder="Search"
          value={query}
          autoFocus
          onFocus={e => e.target.select()}
          onInput={e => debounceInput(e.currentTarget.value)}
          onKeyDown={async e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setQuery('');
            } else if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.blur();
              await navigateRef.current?.navigate();
            }
          }}
        />
      </label>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 loading loading-spinner" />
          </div>
        }
      >
        <Search query={query} ref={navigateRef} />
      </Suspense>
    </div>
  );
}

export const Route = createFileRoute('/search')({
  component: SearchPage,
});
