import calcIndex from './calc/-list.gen.json';
import conditionsIndex from './conditions/-list.gen.json';
import investigationsIndex from './investigations/-list.gen.json';
import managementsIndex from './managements/-list.gen.json';
import { WikiPage } from '../utils/types';

export interface LinkedPage {
  type: string;
  key: string;
  title: string;
}

interface CompiledEntry {
  page: LinkedPage;
  regexes: RegExp[];
}

function compile(type: string, entries: WikiPage[]): CompiledEntry[] {
  return entries
    .filter(entry => entry.patterns.length > 0)
    .map(entry => ({
      page: { type, key: entry.key, title: entry.title },
      regexes: entry.patterns.flatMap(pattern => {
        try {
          return [new RegExp(pattern, 'i')];
        } catch {
          console.warn(
            `⚠️  Invalid todo-link pattern "${pattern}" in ${type}/${entry.key}`
          );
          return [];
        }
      }),
    }));
}

const compiledEntries: CompiledEntry[] = [
  ...compile('calc', calcIndex),
  ...compile('conditions', conditionsIndex),
  ...compile('investigations', investigationsIndex),
  ...compile('managements', managementsIndex),
];

export interface TodoLinkMatch {
  page: LinkedPage;
  match: string;
  start: number;
  end: number;
}

export function findTodoLinks(text: string): TodoLinkMatch[] {
  const results: TodoLinkMatch[] = [];
  for (const entry of compiledEntries) {
    for (const regex of entry.regexes) {
      const m = regex.exec(text);
      if (m) {
        results.push({
          page: entry.page,
          match: m[0],
          start: m.index,
          end: m.index + m[0].length,
        });
        break;
      }
    }
  }
  return results;
}

export interface TextSegment {
  text: string;
  highlighted: boolean;
}

export function buildHighlightSegments(
  text: string,
  matches: TodoLinkMatch[]
): TextSegment[] {
  if (matches.length === 0) return [{ text, highlighted: false }];

  const ranges = matches
    .map(m => [m.start, m.end] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor)
      segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true });
    cursor = end;
  }
  if (cursor < text.length)
    segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}
