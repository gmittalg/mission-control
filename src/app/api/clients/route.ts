import { NextRequest, NextResponse } from 'next/server';
import { getMasterDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getMasterDb();
        const clients = db.prepare('SELECT id, name, gateway_url, created_at FROM clients ORDER BY name ASC').all();

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, gateway_url, gateway_token, db_path } = body;

        if (!id || !name || !gateway_url || !gateway_token || !db_path) {
            return NextResponse.json(
                { error: 'id, name, gateway_url, gateway_token, and db_path are required' },
                { status: 400 }
            );
        }

        const db = getMasterDb();

        // Check if client already exists
        const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
        if (existing) {
            return NextResponse.json({ error: 'Client with this ID already exists' }, { status: 409 });
        }

        db.prepare(`
            INSERT INTO clients (id, name, gateway_url, gateway_token, db_path)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, gateway_url, gateway_token, db_path);

        return NextResponse.json({ success: true, client: { id, name, gateway_url } }, { status: 201 });
    } catch (error) {
        console.error('Failed to create client:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create client' },
            { status: 500 }
        );
    }
}
