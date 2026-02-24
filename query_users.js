const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'neqtra_pos', password: 'postgres', port: 5432 });
client.connect().then(async () => {
  const res = await client.query('SELECT username, passcode, "tenantId" FROM users');
  console.log(res.rows);
  client.end();
}).catch(console.error);
