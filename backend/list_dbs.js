const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: '127.0.0.1', database: 'postgres', password: 'postgres', port: 5432 });
client.connect().then(async () => {
  const res = await client.query("SELECT datname FROM pg_database WHERE datname LIKE 'tenant_%'");
  console.log("Databases:", res.rows.map(r => r.datname));
  client.end();
}).catch(console.error);
