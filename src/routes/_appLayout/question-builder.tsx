import { createFileRoute, useLoaderData } from '@tanstack/react-router';

import QueryBuilder from '../../pages/queryBuilder/QueryBuilder';

export const Route = createFileRoute('/_appLayout/question-builder')({
  component: Index,
  ssr: false,
});

function Index() {
  return <QueryBuilder />;
}
