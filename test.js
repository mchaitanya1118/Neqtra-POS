const http = require('http');

const data = JSON.stringify({ passcode: "0000" });

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log("LOGIN STATUS:", res.statusCode);
    console.log("LOGIN BODY:", body);
    try {
      const parsed = JSON.parse(body);
      const token = parsed.access_token;
      const tenant = parsed.user.tenantId;
      console.log("TOKEN EXTRACTED:", token ? "YES" : "NO", "TENANT:", tenant);
      
      if(token) {
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
      }
    } catch(e) {
      console.log("PARSE ERROR", e);
    }
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
