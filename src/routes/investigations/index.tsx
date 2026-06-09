import { createFileRoute } from '@tanstack/react-router';
import allEntries from './-list.gen.json';
import SearchableIndex from '../../components/SearchableIndex';

export const Route = createFileRoute('/investigations/')({
  component: () => (
    <SearchableIndex entries={allEntries} routeBase="/investigations/" />
  ),
});
