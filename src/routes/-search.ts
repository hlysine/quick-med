import treatmentsIndex from './treatments/-list.gen.json';
import conditionsIndex from './conditions/-list.gen.json';
import calcIndex from './calc/-list.gen.json';
import algorithmsIndex from './algorithms/-list.gen.json';
import MiniSearch, { SearchResult } from 'minisearch';
import { markdownToText } from '../utils/markdownUtils';
import { r } from 'readable-regexp';

console.time('Search Indexing');

const treatmentsContent = Object.entries(
  import.meta.glob<true, string, string>('../content/treatments/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
);
const conditionsContent = Object.entries(
  import.meta.glob<true, string, string>('../content/conditions/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
);
const calcContent = Object.entries(
  import.meta.glob<true, string, string>('../content/calc/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
);
const algorithmsContent = Object.entries(
  import.meta.glob<true, string, string>('../content/algorithms/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
);

interface PageEntry {
  title: string;
  section: string;
  keywords: string[];
  key: string;
}

interface SearchEntry extends PageEntry {
  id: string;
  content: string;
}

const searchIndex: SearchEntry[] = [];

function addToSearchStore(
  type: string,
  contentList: [string, string][],
  entry: PageEntry
) {
  const id = `${type}/${entry.key}`;
  const content =
    contentList.find(([key]) => key.endsWith(`${entry.key}.md`))?.[1] ?? '';
  const searchEntry: SearchEntry = {
    ...entry,
    id,
    content: markdownToText(content),
  };
  searchIndex.push(searchEntry);
}

treatmentsIndex.forEach(entry => {
  addToSearchStore('treatments', treatmentsContent, entry);
});
conditionsIndex.forEach(entry => {
  addToSearchStore('conditions', conditionsContent, entry);
});
calcIndex.forEach(entry => {
  addToSearchStore('calc', calcContent, entry);
});
algorithmsIndex.forEach(entry => {
  addToSearchStore('algorithms', algorithmsContent, entry);
});

const miniSearch = new MiniSearch({
  fields: ['title', 'section', 'keywords', 'content'],
  storeFields: ['id', 'title', 'section', 'keywords', 'content', 'key'],
  searchOptions: {
    boost: { title: 2, section: 1.5, keywords: 1.2 },
    fuzzy: 0.2,
    prefix: true,
  },
});
miniSearch.addAll(searchIndex);

export interface PageResult extends Omit<SearchResult, 'id'>, SearchEntry {
  preview: string;
  terms: string[];
  link: string;
}

const defaultResult = searchIndex.map(entry => ({
  ...entry,
  preview: '',
  terms: [],
  link: `/${entry.id}`,
}));

const textFragmentRegex = r
  .match(
    r.lineStart,
    r.capture.zeroOrMoreLazily.char,
    r.notCharIn(r.word, r.whitespace),
    r.zeroOrMore.char,
    r.notCharIn(r.word, r.whitespace),
    r.capture.zeroOrMoreLazily.char,
    r.lineEnd
  )
  .toRegExp('s');

function createTextFragment(target: string) {
  target = target.trim();
  const match = textFragmentRegex.exec(target);
  if (!match) return encodeURIComponent(target);
  return (
    encodeURIComponent(match[1].trim()) +
    ',' +
    encodeURIComponent(match[2].trim())
  );
}

console.timeEnd('Search Indexing');

export function search(query: string): PageResult[] {
  if (query.length === 0) return defaultResult;
  const searchResults = miniSearch.search(query) as unknown as PageResult[];
  return searchResults.map(result => {
    const preview =
      new RegExp(`^.*${result.terms[0]}.*$`, 'mi').exec(result.content)?.[0] ??
      '';
    return {
      ...result,
      preview,
      link: `/${result.id}#:~:text=${createTextFragment(preview)}`,
    };
  });
}
