#!/bin/bash
# 1. Login to get token
RES=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"passcode": "1234"}')

TOKEN=$(echo $RES | node -pe "JSON.parse(fs.readFileSync('/dev/stdin')).access_token")
TENANT=$(echo $RES | node -pe "JSON.parse(fs.readFileSync('/dev/stdin')).user.tenantId")

echo "Token: $TOKEN"
echo "Tenant: $TENANT"

# 2. Call dashboard
curl -v -s -X GET http://localhost:3001/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT"

