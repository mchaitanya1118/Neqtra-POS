async function test() {
    try {
        const res = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testuser123@example.com', password: 'password' })
        });
        const parsed = await res.json();
        console.log("LOGIN INFO:", parsed.user?.tenantId);

        if (parsed.access_token) {
            const dbReq = await fetch('http://localhost:3001/dashboard', {
                headers: {
                    'Authorization': 'Bearer ' + parsed.access_token,
                    'x-tenant-id': parsed.user.tenantId
                }
            });
            const dbText = await dbReq.text();
            console.log("DASHBOARD HTTP", dbReq.status);
            console.log("DASHBOARD BODY:", dbText);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
