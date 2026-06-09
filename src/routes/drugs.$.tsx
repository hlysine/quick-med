import { createFileRoute, redirect } from '@tanstack/react-router';

// Legacy redirect for drugs to managements
export const Route = createFileRoute('/drugs/$')({
  beforeLoad: ({ params: { _splat = '' } }) => {
    return redirect({
      to: '/managements/' + _splat,
    });
  },
});
