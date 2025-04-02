import { api } from '@convex/_generated/api';
import type { AppLoadContext, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { fetchQuery } from 'convex/nextjs';

export function getConvexUrlInLoader(context: AppLoadContext) {
  // Might be set via cloudflare, or in an `.env.local`
  const convexUrl = (context.cloudflare.env as Record<string, any>).CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) {
    throw new Error('CONVEX_URL is not set');
  }
  return convexUrl;
}

export function getFlexAuthModeInLoader(context: AppLoadContext): 'InviteCode' | 'ConvexOAuth' {
  const authMode = (context.cloudflare.env as Record<string, any>).FLEX_AUTH_MODE || process.env.FLEX_AUTH_MODE;

  if (authMode === 'InviteCode') {
    return 'InviteCode';
  }
  if (authMode === 'ConvexOAuth') {
    return 'ConvexOAuth';
  }
  console.error(`FLEX_AUTH_MODE has unexpected value: ${authMode}, defaulting to ConvexOAuth`);
  return 'ConvexOAuth';
}

export const CONVEX_INVITE_CODE_QUERY_PARAM = 'cvx-code';

export async function handleConvexAuthMode(args: LoaderFunctionArgs) {
  const authMode = getFlexAuthModeInLoader(args.context);
  switch (authMode) {
    case 'InviteCode': {
      const url = new URL(args.request.url);
      const searchParams = new URLSearchParams(url.search);
      const code = searchParams.get(CONVEX_INVITE_CODE_QUERY_PARAM);
      const convexUrl = getConvexUrlInLoader(args.context);
      if (code) {
        const sessionId = await fetchQuery(api.sessions.getSession, { code }, { url: convexUrl });
        if (sessionId) {
          return sessionId;
        }
      }
      return null;
    }
    case 'ConvexOAuth':
      return null;
    default: {
      const exhaustiveCheck: never = authMode;
      console.error(`Unexpected auth mode: ${exhaustiveCheck}`);
      return null;
    }
  }
}
