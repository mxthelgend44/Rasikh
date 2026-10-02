import { NextResponse } from 'next/server';
import { getRuntime } from '@/lib/agent-runtime';
import { DOCUMENT_KINDS, type DocumentKind } from '@/lib/agent-runtime/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Narrow server entry point for the document-review journey.
 * Actions: extract -> confirm -> decide. The OpenAI key is read server-side only (see getRuntime).
 * No authentication exists in the app yet: callers are trusted to be the newcomer, which is a
 * documented limitation, not a security guarantee.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.action !== 'string')
    return NextResponse.json({ error: { code: 'invalid_request' } }, { status: 400 });
  const { runtime: agent, audit } = getRuntime();
  try {
    switch (body.action) {
      case 'extract': {
        const doc = body.document as { ref?: unknown; kind?: unknown; text?: unknown } | undefined;
        if (
          !doc ||
          typeof body.case_id !== 'string' ||
          typeof doc.ref !== 'string' ||
          typeof doc.text !== 'string' ||
          !DOCUMENT_KINDS.includes(doc.kind as DocumentKind)
        )
          throw new TypeError('invalid_request');
        const journey = await agent.extract({
          case_id: body.case_id,
          document: { ref: doc.ref, kind: doc.kind as DocumentKind, text: doc.text },
          acknowledge_provider_disclosure: body.acknowledge_provider_disclosure === true,
        });
        return NextResponse.json(view(journey, audit.forJourney(journey.id)));
      }
      case 'confirm': {
        const journey = agent.confirmReview({
          journey_id: String(body.journey_id),
          confirmed_by: body.confirmed_by as 'newcomer',
          corrections:
            (body.corrections as Record<string, string | number> | undefined) ?? undefined,
        });
        return NextResponse.json(view(journey, audit.forJourney(journey.id)));
      }
      case 'decide': {
        const journey = await agent.decide({
          journey_id: String(body.journey_id),
          proposal_id: String(body.proposal_id),
          digest: String(body.digest),
          approved: body.approved === true,
          approved_by: body.approved_by as 'newcomer',
        });
        return NextResponse.json(view(journey, audit.forJourney(journey.id)));
      }
      default:
        throw new TypeError('invalid_request');
    }
  } catch (error) {
    const message = error instanceof TypeError ? error.message : 'internal';
    const status = error instanceof TypeError ? (message === 'unknown_journey' ? 404 : 400) : 500;
    return NextResponse.json(
      { error: { code: error instanceof TypeError ? message : 'internal' } },
      { status },
    );
  }
}

function view(
  journey: ReturnType<ReturnType<typeof getRuntime>['runtime']['store']['get']> & object,
  audit: unknown,
) {
  const { guard_session_id: _session, ...safe } = journey;
  void _session;
  return { ...safe, audit };
}
