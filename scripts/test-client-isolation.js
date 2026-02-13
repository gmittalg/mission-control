const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Mock paths for testing
const MASTER_DB_PATH = path.join(__dirname, '../test-master.db');
const CLIENT_A_DB_PATH = path.join(__dirname, '../test-client-a.db');
const CLIENT_B_DB_PATH = path.join(__dirname, '../test-client-b.db');

// Cleanup previous test runs
[MASTER_DB_PATH, CLIENT_A_DB_PATH, CLIENT_B_DB_PATH].forEach(p => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
});

console.log('🚀 Starting Client Isolation Tests...');

// 1. Setup Master Database
const masterDb = new Database(MASTER_DB_PATH);
masterDb.exec(`
    CREATE TABLE clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gateway_url TEXT NOT NULL,
        gateway_token TEXT NOT NULL,
        db_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

masterDb.prepare(`
    INSERT INTO clients (id, name, gateway_url, gateway_token, db_path)
    VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
`).run(
    'client-a', 'Client Alpha', 'ws://gateway-a', 'token-a', CLIENT_A_DB_PATH,
    'client-b', 'Client Beta', 'ws://gateway-b', 'token-b', CLIENT_B_DB_PATH
);

console.log('✅ Master Database initialized with 2 clients.');

// 2. Mock individual client databases (Schema)
const taskSchema = `
    CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'inbox'
    );
`;

const dbA = new Database(CLIENT_A_DB_PATH);
dbA.exec(taskSchema);
dbA.prepare('INSERT INTO tasks (id, title) VALUES (?, ?)').run('task-a-1', 'Client A Task');

const dbB = new Database(CLIENT_B_DB_PATH);
dbB.exec(taskSchema);
dbB.prepare('INSERT INTO tasks (id, title) VALUES (?, ?)').run('task-b-1', 'Client B Task');

console.log('✅ Client databases initialized with isolated data.');

// 3. Verification Logic (Simulating the App Logic)
function getDbPath(clientId) {
    const config = masterDb.prepare('SELECT db_path FROM clients WHERE id = ?').get(clientId);
    return config ? config.db_path : null;
}

function getTasks(clientId) {
    const dbPath = getDbPath(clientId);
    if (!dbPath) throw new Error('Client not found');
    const db = new Database(dbPath);
    return db.prepare('SELECT * FROM tasks').all();
}

console.log('🔍 Verifying isolation...');

const tasksA = getTasks('client-a');
const tasksB = getTasks('client-b');

console.log(`Client A Tasks: ${tasksA.map(t => t.title).join(', ')}`);
console.log(`Client B Tasks: ${tasksB.map(t => t.title).join(', ')}`);

if (tasksA.length === 1 && tasksA[0].id === 'task-a-1' &&
    tasksB.length === 1 && tasksB[0].id === 'task-b-1') {
    console.log('✨ SUCCESS: Client data is strictly isolated!');
} else {
    console.error('❌ FAILURE: Isolation check failed!');
    process.exit(1);
}

// Cleanup
masterDb.close();
dbA.close();
dbB.close();
[MASTER_DB_PATH, CLIENT_A_DB_PATH, CLIENT_B_DB_PATH].forEach(p => fs.unlinkSync(p));
console.log('🧹 Cleanup complete.');
