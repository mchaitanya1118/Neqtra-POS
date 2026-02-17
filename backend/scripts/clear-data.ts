import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearData() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'neqtra_pos',
        logging: true,
    });

    try {
        await dataSource.initialize();
        console.log('Database connection established.');

        const sqlPath = join(__dirname, 'clear-data.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        console.log('Executing cleanup script...');
        await dataSource.query(sql);

        console.log('SUCCESS: Entry data cleared successfully.');
    } catch (error) {
        console.error('ERROR during data cleanup:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

clearData();
