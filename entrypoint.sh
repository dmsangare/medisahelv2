#!/bin/sh
# entrypoint.sh - Safe Automated Deployment migrations and seeding for Clinical Environments
set -e

echo "========================================================================"
echo "STARTING MEDISHAHEL ENTERPRISE CLINICAL LIVE RUNTIME SERVICES"
echo "========================================================================"

# 1. Wait for database availability
echo "Checking database connectivity..."
MAX_RETRIES=30
RETRY_INTERVAL=2
COUNT=0

until node -e "
const net = require('net');
const urlString = process.env.DATABASE_URL;
if (!urlString) {
  console.log('DATABASE_URL is not defined. Skipping connectivity check...');
  process.exit(0);
}
try {
  const myUrl = new URL(urlString);
  const host = myUrl.hostname || 'localhost';
  const port = parseInt(myUrl.port) || 5432;
  console.log('Attempting to connect to database at ' + host + ':' + port + '...');
  const client = net.createConnection({ host, port }, () => {
    console.log('Connection established successfully.');
    client.end();
    process.exit(0);
  });
  client.on('error', (err) => {
    console.error('Connection attempt failed: ' + err.message);
    process.exit(1);
  });
  setTimeout(() => {
    console.error('Connection timed out.');
    process.exit(1);
  }, 2500);
} catch (e) {
  console.error('Error parsing DATABASE_URL: ' + e.message);
  process.exit(1);
}
" 2>/dev/null
do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "ERROR: Database did not become reachable within $((MAX_RETRIES * RETRY_INTERVAL)) seconds. Aborting startup."
    exit 1
  fi
  echo "Database is not reachable yet. Retrying in ${RETRY_INTERVAL}s ($COUNT/$MAX_RETRIES)..."
  sleep $RETRY_INTERVAL
done

# 2. Non-destructively apply pending Prisma production migrations
echo "[1/3] Applying pending database migrations safely..."
npx prisma migrate deploy

# 3. Add secure, non-destructive initial doctor/staff accounts
if grep -q '"seed"' package.json; then
  echo "[2/3] Checking and applying database seeds..."
  npx prisma db seed
else
  echo "[2/3] Seeding omitted because seed is not defined in package.json."
fi

# 4. Hand over process control to the clinical app command
echo "[3/3] Launching Node.js main server process..."
echo "========================================================================"

exec "$@"
