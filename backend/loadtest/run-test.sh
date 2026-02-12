#!/bin/bash

# WastePH Load Test Runner (Bash)
# Runs load test against the hosted Render.com backend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WastePH Load Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ Error: k6 is not installed${NC}"
    echo ""
    echo "Install k6:"
    echo "  - Windows: choco install k6"
    echo "  - macOS: brew install k6"
    echo "  - Linux: Visit https://k6.io/docs/getting-started/installation/"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ k6 is installed${NC}"
echo ""

# Get backend URL
if [ -z "$BASE_URL" ]; then
    echo -e "${YELLOW}⚠️  BASE_URL not set in environment${NC}"
    echo ""
    echo "Please set your Render.com backend URL:"
    read -p "Enter backend URL (e.g., https://wasteph-backend.onrender.com/api): " BASE_URL
    echo ""
fi

if [ -z "$BASE_URL" ]; then
    echo -e "${RED}❌ No backend URL provided. Exiting.${NC}"
    exit 1
fi

echo -e "${BLUE}Target: ${BASE_URL}${NC}"
echo ""

# Ask if user wants to seed data
echo -e "${YELLOW}Do you want to seed test users and data first?${NC}"
echo "  This requires your database connection to be configured."
read -p "Seed data? (y/n): " seed_choice
echo ""

if [[ "$seed_choice" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📦 Seeding test users...${NC}"
    cd ..
    npm run seed:loadtest-users || {
        echo -e "${RED}❌ Failed to seed users${NC}"
        exit 1
    }
    
    echo ""
    echo -e "${BLUE}📦 Seeding test data...${NC}"
    npm run seed:loadtest-data || {
        echo -e "${RED}❌ Failed to seed data${NC}"
        exit 1
    }
    
    cd loadtest
    echo ""
fi

# Run the load test
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Starting Load Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Configuration:"
echo "  - Virtual Users: 6 concurrent staff"
echo "  - Duration: 6 minutes"
echo "  - Backend: $BASE_URL"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the test${NC}"
echo ""

# Create results directory if it doesn't exist
mkdir -p results

# Generate timestamp for results file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="results/results_${TIMESTAMP}.json"

# Run k6 with JSON output
BASE_URL="$BASE_URL" k6 run \
  --out json="$RESULTS_FILE" \
  staff-workflow.js

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Load Test Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the summary above"
echo "  2. Check if all thresholds passed (✓)"
echo "  3. Document results in RESULTS.md"
echo ""
echo "Key metrics to check:"
echo "  - http_req_duration p95 < 2000ms"
echo "  - http_req_failed rate < 5%"
echo "  - checks rate > 95%"
echo ""
