import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const dbName = 'tenant_8e15e530_ac36_47bf_a3e1_f4965cf53d95';

    console.log(`Attempting to drop corrupted database: ${dbName}`);

    try {
        // Terminate active connections
        await dataSource.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
        `);

        // Drop database
        await dataSource.query(`DROP DATABASE IF EXISTS "${dbName}"`);
        console.log(`Successfully dropped ${dbName}. It will be recreated on next login.`);
    } catch (error) {
        console.error(`Failed to drop ${dbName}:`, error.message);
    } finally {
        await app.close();
    }
}

bootstrap();
