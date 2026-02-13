import { NextRequest, NextResponse } from 'next/server';
import { getMasterDb } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/clients/[id] - Get specific client configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const db = getMasterDb();
        const client = db.prepare('SELECT id, name, gateway_url, db_path, created_at, updated_at FROM clients WHERE id = ?').get(id);

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Failed to get client:', error);
        return NextResponse.json({ error: 'Failed to get client' }, { status: 500 });
    }
}

// PATCH /api/clients/[id] - Update client configuration
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, gateway_url, gateway_token, db_path } = body;

        const db = getMasterDb();
        const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const updates: string[] = [];
        const values: unknown[] = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (gateway_url) {
            updates.push('gateway_url = ?');
            values.push(gateway_url);
        }
        if (gateway_token) {
            updates.push('gateway_token = ?');
            values.push(gateway_token);
        }
        if (db_path) {
            updates.push('db_path = ?');
            values.push(db_path);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        db.prepare(`
            UPDATE clients 
            SET ${updates.join(', ')} 
            WHERE id = ?
        `).run(...values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update client:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update client' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (id === 'default') {
            return NextResponse.json({ error: 'Cannot delete the default client' }, { status: 403 });
        }

        const db = getMasterDb();
        const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete client:', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
