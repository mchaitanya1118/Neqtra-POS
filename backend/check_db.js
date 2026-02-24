const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'neqtra_pos', password: 'postgres', port: 5432 });
client.connect().then(async () => {
    const users = await client.query('SELECT username, passcode, "tenantId" FROM users');
    console.table(users.rows);
    const tenants = await client.query('SELECT id, name FROM tenants');
    console.table(tenants.rows);
    client.end();
}).catch(console.error);
