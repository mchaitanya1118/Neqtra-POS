const { Client } = require('pg');

async function checkDatabase(dbName) {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    const res = await client.query('SELECT datname FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rows.length > 0) {
      console.log(`Database ${dbName} exists.`);
      return true;
    } else {
      console.log(`Database ${dbName} does not exist.`);
      return false;
    }
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
    return false;
  } finally {
    await client.end();
  }
}

const dbToCheck = process.argv[2];
if (!dbToCheck) {
  console.error('Please provide a database name.');
  process.exit(1);
}

checkDatabase(dbToCheck);
