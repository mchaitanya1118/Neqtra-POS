const http = require('http');

const data = JSON.stringify({
  name: "Test User",
  email: "testuser123@example.com",
  password: "password",
  businessName: "Test Cafe",
  businessType: "CAFE"
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      const token = parsed.access_token;
      const tenant = parsed.user.tenantId;
      console.log("Signup success! Tenant ID:", tenant);
      
      const dreq = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/dashboard',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'x-tenant-id': tenant
        }
      }, (dres) => {
        let dbody = '';
        dres.on('data', d => dbody += d);
        dres.on('end', () => {
           console.log("DASHBOARD STATUS:", dres.statusCode);
           console.log("DASHBOARD BODY:", dbody);
        });
      });
      dreq.end();
    } catch(e) { console.error(e); }
  });
});
req.write(data);
req.end();
