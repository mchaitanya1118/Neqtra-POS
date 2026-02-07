# Seed Menu
curl -X POST http://localhost:3001/menu/seed

# Get Menu
curl http://localhost:3001/menu/categories

# Create Order
curl -X POST http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableName": "Table 1",
    "items": [
      { "menuItemId": 1, "quantity": 1 }
    ]
  }'

# Get Orders
curl http://localhost:3001/orders
