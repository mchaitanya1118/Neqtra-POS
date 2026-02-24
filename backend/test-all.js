const http = require('http');

function testLogin(passcode, email, password) {
  return new Promise((resolve) => {
    let data;
    if (passcode) data = JSON.stringify({ passcode });
    else data = JSON.stringify({ username: email, password });
    
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.access_token) {
             const token = parsed.access_token;
             const tenant = parsed.user?.tenantId || '';
             const dreq = http.request({
               hostname: 'localhost', port: 3001, path: '/dashboard', method: 'GET',
               headers: { 'Authorization': 'Bearer ' + token, 'x-tenant-id': tenant }
             }, (dres) => {
               console.log("LOGIN " + (passcode || email) + " -> DASHBOARD HTTP " + dres.statusCode);
               resolve();
             });
             dreq.end();
          } else {
             console.log("LOGIN " + (passcode || email) + " -> FAILED HTTP " + res.statusCode);
             resolve();
          }
        } catch(e) { resolve(); }
      });
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  await testLogin("0000");
  await testLogin("1234");
  await testLogin(null, "testuser123@example.com", "password");
}
run();
