import { NextRequest } from 'next/server';

export function getClientId(request: NextRequest): string {
    // Check header first
    const headerId = request.headers.get('x-client-id');
    if (headerId) return headerId;

    // Then check query param
    const queryId = request.nextUrl.searchParams.get('clientId');
    if (queryId) return queryId;

    return 'default';
}
