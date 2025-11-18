#!/bin/bash

# MBTQ Universe - Postman CLI Setup & Testing Suite

# This script sets up comprehensive API testing for your decentralized ecosystem

set -e

# Colors for output

RED=’\033[0;31m’
GREEN=’\033[0;32m’
YELLOW=’\033[1;33m’
BLUE=’\033[0;34m’
NC=’\033[0m’ # No Color

echo -e “${BLUE}🧬 MBTQ Universe - Postman CLI Setup${NC}”
echo “===============================================”

# Check if Newman (Postman CLI) is installed

if ! command -v newman &> /dev/null; then
echo -e “${YELLOW}Installing Newman (Postman CLI)…${NC}”
npm install -g newman
npm install -g newman-reporter-htmlextra
else
echo -e “${GREEN}Newman already installed${NC}”
fi

# Create directory structure

mkdir -p mbtq-api-tests/{collections,environments,reports,data}

# Create environment files

echo -e “${BLUE}Creating environment configurations…${NC}”

# Development Environment

cat > mbtq-api-tests/environments/dev.json << EOF
{
“id”: “mbtq-dev-env”,
“name”: “MBTQ Development”,
“values”: [
{
“key”: “base_url”,
“value”: “https://dev-api.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “deaf_auth_url”,
“value”: “https://dev-deafauth.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “pinksync_url”,
“value”: “https://dev-pinksync.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “fibonrose_url”,
“value”: “https://dev-fibonrose.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “magicians_url”,
“value”: “https://dev-360magicians.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “test_username”,
“value”: “mbtq_test_user”,
“enabled”: true
},
{
“key”: “test_password”,
“value”: “secure_test_pass_123”,
“enabled”: true
}
]
}
EOF

# Production Environment

cat > mbtq-api-tests/environments/prod.json << EOF
{
“id”: “mbtq-prod-env”,
“name”: “MBTQ Production”,
“values”: [
{
“key”: “base_url”,
“value”: “https://api.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “deaf_auth_url”,
“value”: “https://deafauth.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “pinksync_url”,
“value”: “https://pinksync.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “fibonrose_url”,
“value”: “https://fibonrose.mbtquniverse.com”,
“enabled”: true
},
{
“key”: “magicians_url”,
“value”: “https://360magicians.mbtquniverse.com”,
“enabled”: true
}
]
}
EOF

# Create test data files

echo -e “${BLUE}Creating test data files…${NC}”

cat > mbtq-api-tests/data/test-users.json << EOF
[
{
“username”: “deaf_community_leader”,
“email”: “leader@deafcommunity.test”,
“deaf_verification”: true,
“asl_proficiency”: “native”,
“community_role”: “advocate”
},
{
“username”: “accessibility_dev”,
“email”: “dev@accessibility.test”,
“deaf_verification”: true,
“asl_proficiency”: “fluent”,
“community_role”: “developer”
},
{
“username”: “dao_member”,
“email”: “member@dao.test”,
“deaf_verification”: true,
“asl_proficiency”: “intermediate”,
“community_role”: “contributor”
}
]
EOF

# Create comprehensive test runner script

cat > mbtq-api-tests/run-tests.sh << ‘EOF’
#!/bin/bash

# MBTQ API Test Runner

# Comprehensive testing suite for all MBTQ ecosystem components

set -e

ENVIRONMENT=${1:-dev}
TEST_SUITE=${2:-all}
REPORT_DIR=“reports/$(date +%Y%m%d_%H%M%S)”

mkdir -p “$REPORT_DIR”

echo “🧬 Running MBTQ API Tests - Environment: $ENVIRONMENT”
echo “==================================================”

# Function to run specific test suite

run_test_suite() {
local suite_name=$1
local collection_file=$2

```
echo "Running $suite_name tests..."

newman run "$collection_file" \
    -e "environments/$ENVIRONMENT.json" \
    -d "data/test-users.json" \
    --reporters htmlextra,cli \
    --reporter-htmlextra-export "$REPORT_DIR/${suite_name}_report.html" \
    --reporter-htmlextra-title "MBTQ $suite_name API Tests" \
    --reporter-htmlextra-logs \
    --timeout 30000 \
    --delay-request 500
```

}

# Test execution based on suite parameter

case $TEST_SUITE in
“auth”)
echo “🔐 Testing DeafAUTH only…”
run_test_suite “DeafAUTH” “collections/mbtq-master-collection.json” –folder “🧬 DeafAUTH - Identity Cortex”
;;
“sync”)
echo “🔄 Testing PinkSync only…”
run_test_suite “PinkSync” “collections/mbtq-master-collection.json” –folder “🔄 PinkSync - Nervous System”
;;
“trust”)
echo “🏆 Testing Fibonrose only…”
run_test_suite “Fibonrose” “collections/mbtq-master-collection.json” –folder “🏆 Fibonrose - Ethics Engine”
;;
“ai”)
echo “🎭 Testing 360Magicians only…”
run_test_suite “360Magicians” “collections/mbtq-master-collection.json” –folder “🎭 360Magicians - Muscle Memory”
;;
“dao”)
echo “🏛️ Testing DAO only…”
run_test_suite “DAO” “collections/mbtq-master-collection.json” –folder “🏛️ DAO Governance”
;;
“all”|*)
echo “🌟 Running complete MBTQ ecosystem tests…”
run_test_suite “Complete_MBTQ_Suite” “collections/mbtq-master-collection.json”
;;
esac

echo “”
echo “✅ Test execution completed!”
echo “📊 Reports available in: $REPORT_DIR”
echo “”
echo “🔗 Quick commands:”
echo “   View HTML report: open $REPORT_DIR/*.html”
echo “   Re-run tests: ./run-tests.sh $ENVIRONMENT $TEST_SUITE”

EOF

chmod +x mbtq-api-tests/run-tests.sh

# Create monitoring script

cat > mbtq-api-tests/monitor.sh << ‘EOF’
#!/bin/bash

# MBTQ API Monitoring Script

# Continuous monitoring of all ecosystem endpoints

ENVIRONMENT=${1:-prod}
INTERVAL=${2:-300} # 5 minutes default

echo “🔍 Starting MBTQ API Monitoring - Environment: $ENVIRONMENT”
echo “Checking every $INTERVAL seconds…”

while true; do
echo “$(date): Running health checks…”

```
# Run lightweight health check collection
newman run collections/mbtq-health-check.json \
    -e "environments/$ENVIRONMENT.json" \
    --reporters cli \
    --bail \
    --timeout 10000 2>&1 | grep -E "(PASS|FAIL|Error)" || echo "Health check completed"

echo "Next check in $INTERVAL seconds..."
sleep $INTERVAL
```

done
EOF

chmod +x mbtq-api-tests/monitor.sh

# Create health check collection

cat > mbtq-api-tests/collections/mbtq-health-check.json << ‘EOF’
{
“info”: {
“name”: “MBTQ Health Check”,
“description”: “Lightweight health monitoring for MBTQ ecosystem”,
“version”: “1.0.0”
},
“item”: [
{
“name”: “DeafAUTH Health”,
“request”: {
“method”: “GET”,
“url”: “{{deaf_auth_url}}/health”
},
“event”: [
{
“listen”: “test”,
“script”: {
“exec”: [
“pm.test(‘DeafAUTH is healthy’, function () {”,
“    pm.response.to.have.status(200);”,
“});”
]
}
}
]
},
{
“name”: “PinkSync Health”,
“request”: {
“method”: “GET”,
“url”: “{{pinksync_url}}/health”
},
“event”: [
{
“listen”: “test”,
“script”: {
“exec”: [
“pm.test(‘PinkSync is healthy’, function () {”,
“    pm.response.to.have.status(200);”,
“});”
]
}
}
]
},
{
“name”: “Fibonrose Health”,
“request”: {
“method”: “GET”,
“url”: “{{fibonrose_url}}/health”
},
“event”: [
{
“listen”: “test”,
“script”: {
“exec”: [
“pm.test(‘Fibonrose is healthy’, function () {”,
“    pm.response.to.have.status(200);”,
“});”
]
}
}
]
},
{
“name”: “360Magicians Health”,
“request”: {
“method”: “GET”,
“url”: “{{magicians_url}}/health”
},
“event”: [
{
“listen”: “test”,
“script”: {
“exec”: [
“pm.test(‘360Magicians is healthy’, function () {”,
“    pm.response.to.have.status(200);”,
“});”
]
}
}
]
}
]
}
EOF

# Create CI/CD integration script

cat > mbtq-api-tests/ci-cd-integration.sh << ‘EOF’
#!/bin/bash

# MBTQ CI/CD Integration Script

# For GitHub Actions, GitLab CI, or any CI/CD pipeline

set -e

ENVIRONMENT=${CI_ENVIRONMENT:-dev}
EXIT_CODE=0

echo “🚀 MBTQ API Tests - CI/CD Integration”
echo “Environment: $ENVIRONMENT”

# Install dependencies

npm install -g newman newman-reporter-htmlextra

# Run tests and capture exit code

if ! newman run collections/mbtq-master-collection.json   
-e “environments/$ENVIRONMENT.json”   
-d “data/test-users.json”   
–reporters cli,junit   
–reporter-junit-export “reports/junit-results.xml”   
–bail   
–timeout 30000; then
EXIT_CODE=1
fi

# Generate summary

echo “”
echo “📊 Test Summary:”
echo “Environment: $ENVIRONMENT”
echo “Exit Code: $EXIT_CODE”

if [ $EXIT_CODE -eq 0 ]; then
echo “✅ All tests passed!”
else
echo “❌ Some tests failed!”
fi

exit $EXIT_CODE
EOF

chmod +x mbtq-api-tests/ci-cd-integration.sh

# Create package.json for Node.js dependencies

cat > mbtq-api-tests/package.json << EOF
{
“name”: “mbtq-api-tests”,
“version”: “1.0.0”,
“description”: “API testing suite for MBTQ Universe ecosystem”,
“scripts”: {
“test”: “./run-tests.sh”,
“test:dev”: “./run-tests.sh dev”,
“test:prod”: “./run-tests.sh prod”,
“test:auth”: “./run-tests.sh dev auth”,
“test:sync”: “./run-tests.sh dev sync”,
“test:trust”: “./run-tests.sh dev trust”,
“test:ai”: “./run-tests.sh dev ai”,
“test:dao”: “./run-tests.sh dev dao”,
“monitor”: “./monitor.sh”,
“ci”: “./ci-cd-integration.sh”
},
“dependencies”: {
“newman”: “^6.0.0”,
“newman-reporter-htmlextra”: “^1.23.0”
},
“keywords”: [“api”, “testing”, “mbtq”, “postman”, “accessibility”, “deaf-first”],
“author”: “MBTQ Universe”,
“license”: “MIT”
}
EOF

# Create README with usage instructions

cat > mbtq-api-tests/README.md << ‘EOF’

# MBTQ Universe API Testing Suite

Comprehensive API testing for your decentralized, AI-powered, Deaf-first ecosystem.

## Quick Start

```bash
# Run all tests on development environment
./run-tests.sh dev

# Run specific component tests
./run-tests.sh dev auth    # DeafAUTH only
./run-tests.sh dev sync    # PinkSync only
./run-tests.sh dev trust   # Fibonrose only
./run-tests.sh dev ai      # 360Magicians only
./run-tests.sh dev dao     # DAO Governance only

# Run production tests
./run-tests.sh prod

# Start monitoring
./monitor.sh prod 300  # Check every 5 minutes
```

## npm Scripts

```bash
npm test              # Run all tests
npm run test:dev      # Dev environment tests
npm run test:prod     # Production tests
npm run test:auth     # DeafAUTH tests only
npm run monitor       # Start monitoring
npm run ci            # CI/CD integration
```

## Directory Structure

```
mbtq-api-tests/
├── collections/           # Postman collections
├── environments/          # Environment configurations
├── data/                 # Test data files
├── reports/              # Test reports
├── run-tests.sh          # Main test runner
├── monitor.sh            # Monitoring script
└── ci-cd-integration.sh  # CI/CD integration
```

## Environment Variables

Set these in your environment files:

- `mbtq_master_token`: Your master API token
- `test_username`: Test user credentials
- `test_password`: Test user password
- `user_id`: Test user ID
- `agent_id`: Test AI agent ID
- `proposal_id`: Test DAO proposal ID

## Test Reports

HTML reports are generated in `reports/` with:

- Response times
- Pass/fail status
- Request/response details
- Environment information
- Test metrics

## CI/CD Integration

Use `ci-cd-integration.sh` in your pipeline:

```yaml
# GitHub Actions example
- name: Run MBTQ API Tests
  run: |
    cd mbtq-api-tests
    ./ci-cd-integration.sh
```