import MiniSearch from 'minisearch';
import { memo, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { WikiPage } from '../utils/types';
import CollapsibleSections from './CollapsibleSections';
import MouseDownLink from './MouseDownLink';
import { useNavigate } from '@tanstack/react-router';

export interface SearchableIndexProps {
  entries: WikiPage[];
  routeBase: string;
  showKeywords?: boolean;
}

export default memo(function SearchableIndex({
  entries: allEntries,
  routeBase,
  showKeywords = false,
}: SearchableIndexProps) {
  const [searchString, setSearchString] = useState('');
  const navigate = useNavigate();

  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<WikiPage>({
      idField: 'key',
      fields: ['title', 'section', 'keywords'],
      storeFields: ['title', 'section', 'keywords', 'key'],
      searchOptions: {
        boost: { title: 2, section: 1.5, keywords: 1.2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
    ms.addAll(allEntries);
    return ms;
  }, [allEntries]);

  const sections = useMemo(() => {
    const filteredEntries =
      !searchString || searchString.length === 0
        ? allEntries
        : (miniSearch.search(searchString) as unknown as WikiPage[]);
    return filteredEntries.reduce<Record<string, WikiPage[]>>((acc, entry) => {
      if (!acc[entry.section]) {
        acc[entry.section] = [];
      }
      acc[entry.section].push(entry);
      return acc;
    }, {});
  }, [allEntries, searchString, miniSearch]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 w-full mt-2 max-w-250 self-center">
      <label className="input w-full max-w-100">
        <FaSearch />
        <input
          type="search"
          className="grow"
          placeholder="Search"
          value={searchString}
          onInput={e => setSearchString(e.currentTarget.value)}
          onKeyDown={async e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              setSearchString('');
            } else if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              const entry = Object.values(sections).flat()[0];
              if (!entry) return;
              e.currentTarget.blur();
              await navigate({
                to: routeBase + entry.key,
              });
            }
          }}
        />
      </label>
      <CollapsibleSections sections={sections}>
        {entry => (
          <MouseDownLink
            to={routeBase + entry.key}
            key={entry.title}
            className="w-96 bg-base-200 text-base border-b border-neutral/30 py-3 px-6 hover:bg-base-300 transition-all cursor-pointer"
          >
            {showKeywords ? (
              <>
                <h2 className="">{entry.title}</h2>
                {entry.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.keywords.map((keyword, idx) => (
                      <div key={idx} className="badge badge-secondary badge-sm">
                        {keyword}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              entry.title
            )}
          </MouseDownLink>
        )}
      </CollapsibleSections>
    </div>
  );
});
