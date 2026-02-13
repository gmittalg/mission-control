import { NextResponse } from 'next/server';
import { getMasterDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getMasterDb();
        const clients = db.prepare('SELECT id, name FROM clients ORDER BY name ASC').all();

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}
