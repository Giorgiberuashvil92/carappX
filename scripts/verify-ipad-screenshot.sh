#!/bin/bash

echo "🔍 iPad Screenshot Verification Script"
echo "======================================"
echo ""

# Check if Simulator is running
SIMULATOR_RUNNING=$(pgrep -x Simulator)

if [ -z "$SIMULATOR_RUNNING" ]; then
    echo "⚠️  Simulator is not running"
    echo "Please open Simulator first:"
    echo "   open -a Simulator"
    exit 1
fi

echo "✅ Simulator is running"
echo ""

# Get current device
CURRENT_DEVICE=$(xcrun simctl list devices | grep Booted | grep -i "ipad")

if [ -z "$CURRENT_DEVICE" ]; then
    echo "❌ No iPad device is booted"
    echo ""
    echo "Please:"
    echo "1. Open Simulator"
    echo "2. Select: Hardware > Device > iPad > iPad Pro (12.9-inch) (6th generation)"
    exit 1
fi

echo "✅ Current device:"
echo "   $CURRENT_DEVICE"
echo ""

# Check if it's iPad Pro 12.9-inch
if echo "$CURRENT_DEVICE" | grep -qi "12.9"; then
    echo "✅ Correct device: iPad Pro 12.9-inch"
else
    echo "⚠️  Warning: Device might not be iPad Pro 12.9-inch"
    echo "   Please select: iPad Pro (12.9-inch) (6th generation)"
fi

echo ""
echo "📸 How to take screenshot:"
echo "=========================="
echo "1. Make sure Simulator window is active (click on it)"
echo "2. Press Cmd + S"
echo "3. Screenshot will be saved to Desktop"
echo "4. Check filename - should contain 'iPad Pro'"
echo ""
echo "✅ Ready to take screenshot!"
