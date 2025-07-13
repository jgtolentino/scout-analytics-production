#!/bin/bash

echo "🚀 Deploying MCP SQLite Server to Render..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from scout-analytics-production directory"
    exit 1
fi

# First, let's check if the MCP server repo exists
if [ ! -d "../mcp-sqlite-server" ]; then
    echo "📥 Cloning MCP SQLite Server repository..."
    cd ..
    git clone https://github.com/jgtolentino/mcp-sqlite-server.git
    cd scout-analytics-production
fi

echo "📦 Preparing MCP Server for deployment..."

# Copy Scout Analytics schema to MCP server
echo "📋 Copying Scout Analytics schema..."
cp apps/api/prisma/schema.prisma ../mcp-sqlite-server/schema/scout-analytics.prisma

# Create Scout-specific SQL initialization
cat > ../mcp-sqlite-server/sql/init-scout.sql << 'EOF'
-- Scout Analytics Database Schema
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Store (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    region TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Product (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Transaction (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    storeId TEXT NOT NULL,
    productId TEXT NOT NULL,
    amount REAL NOT NULL,
    quantity INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'PENDING',
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (storeId) REFERENCES Store(id),
    FOREIGN KEY (productId) REFERENCES Product(id)
);

-- Create indexes for performance
CREATE INDEX idx_transaction_user ON Transaction(userId);
CREATE INDEX idx_transaction_store ON Transaction(storeId);
CREATE INDEX idx_transaction_product ON Transaction(productId);
CREATE INDEX idx_transaction_timestamp ON Transaction(timestamp);
EOF

# Update MCP server config for Scout Analytics
cat > ../mcp-sqlite-server/config/scout-config.json << 'EOF'
{
  "name": "scout-analytics-mcp",
  "version": "1.0.0",
  "description": "MCP Server for Scout Analytics Platform",
  "database": {
    "path": "/app/data/scout-analytics.db",
    "schema": "/app/schema/scout-analytics.prisma",
    "initScript": "/app/sql/init-scout.sql"
  },
  "security": {
    "requireApiKey": true,
    "allowedOrigins": ["*"],
    "rateLimit": {
      "windowMs": 60000,
      "max": 100
    }
  },
  "features": {
    "readOnly": false,
    "allowCustomQueries": true,
    "enableMetrics": true
  }
}
EOF

echo ""
echo "✅ MCP Server prepared for Scout Analytics!"
echo ""
echo "📌 Next Steps:"
echo ""
echo "1. Deploy to Render:"
echo "   cd ../mcp-sqlite-server"
echo "   git add ."
echo "   git commit -m 'feat: Configure for Scout Analytics'"
echo "   git push origin main"
echo ""
echo "2. Go to render.com and:"
echo "   - Create new Web Service"
echo "   - Connect to jgtolentino/mcp-sqlite-server"
echo "   - Deploy with Docker"
echo ""
echo "3. After deployment, update your .env:"
echo "   MCP_SERVER_URL=https://your-service.onrender.com"
echo "   MCP_API_KEY=your-generated-api-key"
echo ""
echo "🎯 Your Scout Analytics will then have Claude-accessible database!"