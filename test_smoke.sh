#!/bin/bash

echo "=== SMOKE TEST RESULTS ==="
echo ""

# Test 1: Health endpoint
echo "Test 1: Health endpoint"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health 2>&1)
if [[ "$HEALTH_RESPONSE" == *'"ok":true'* ]]; then
  echo "✓ Health endpoint responded correctly"
  echo "  Response: $HEALTH_RESPONSE"
else
  echo "✗ Health endpoint failed"
  echo "  Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Check backend is running
echo "Test 2: Backend process status"
NODE_COUNT=$(tasklist 2>/dev/null | grep -c "node.exe" || echo "0")
echo "  Node processes running: $NODE_COUNT"
if [ "$NODE_COUNT" -gt "0" ]; then
  echo "✓ Backend process is running"
else
  echo "✗ No backend process found"
fi
echo ""

echo "=== SMOKE TEST COMPLETE ==="
