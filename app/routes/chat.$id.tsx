import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';
import { getFlexAuthModeInLoader, handleConvexAuthMode } from '~/lib/persistence/convex';

export async function loader(args: LoaderFunctionArgs) {
  const sessionId = await handleConvexAuthMode(args);
  const flexAuthMode = getFlexAuthModeInLoader(args.context);
  return Response.json({ id: args.params.id, sessionId, flexAuthMode });
}

export default IndexRoute;
