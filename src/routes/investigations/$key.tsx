import {
  createFileRoute,
  useLoaderData,
  useParams,
} from '@tanstack/react-router';
import StyledMarkdown from '../../components/markdown/StyledMarkdown';
import { useTextFragment } from '../../utils/uiUtils';
import AddToBookmark from '../../components/AddToBookmark';
import allEntries from './-list.gen.json';

function Investigation() {
  const data = useLoaderData({ from: '/investigations/$key' });
  const params = useParams({ from: '/investigations/$key' });
  useTextFragment();
  return (
    <div className="flex-1 p-4 pt-0 overflow-y-auto self-center w-full max-w-250">
      <AddToBookmark
        link={`/investigations/${params.key}`}
        title={allEntries.find(entry => entry.key === params.key)?.title ?? ''}
        className="mt-2"
      />
      <StyledMarkdown>{data}</StyledMarkdown>
    </div>
  );
}

export const Route = createFileRoute('/investigations/$key')({
  component: Investigation,
  loader: async ({ params }) => {
    return (
      (await import(`../../content/investigations/${params.key}.md?raw`)) as {
        default: string;
      }
    ).default;
  },
});
