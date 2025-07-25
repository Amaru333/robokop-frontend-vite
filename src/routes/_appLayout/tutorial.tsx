import { createFileRoute } from '@tanstack/react-router';
import Tutorial from '../../pages/Tutorial';

export const Route = createFileRoute('/_appLayout/tutorial')({
  component: RouteComponent,
  ssr: false,
});

function RouteComponent() {
  return <Tutorial />;
}
