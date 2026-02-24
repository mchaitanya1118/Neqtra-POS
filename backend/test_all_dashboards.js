const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { User } = require('./dist/entities/user.entity');
const { JwtService } = require('@nestjs/jwt');

async function testAllUsers() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersRepo = app.get(getRepositoryToken(User));
    const jwtService = app.get(JwtService);

    const users = await usersRepo.find({ relations: ['roleRel', 'tenant', 'branch'] });

    for (const user of users) {
        const payload = {
            username: user.username,
            sub: user.id,
            role: user.roleRel?.name || 'Staff',
            tenantId: user.tenant?.id,
            branchId: user.branch?.id
        };

        const token = jwtService.sign(payload);
        const tenantId = user.tenant?.id || '';

        try {
            const dbReq = await fetch('http://localhost:3001/dashboard', {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'x-tenant-id': tenantId
                }
            });
            const dbText = await dbReq.text();
            console.log(`USER: ${user.username} | TENANT: ${tenantId} | HTTP: ${dbReq.status}`);
            if (dbReq.status === 500) {
                console.log(`----> ERROR BODY: ${dbText}`);
            }
        } catch (e) {
            console.error(e);
        }
    }
    process.exit(0);
}
testAllUsers();
