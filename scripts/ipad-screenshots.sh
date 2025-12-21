#!/bin/bash

# iPad Screenshots Generator Script
# ეს script დაგეხმარებათ iPad Pro 13-inch screenshots-ების გაკეთებაში

echo "📱 iPad Pro 13-inch Screenshots Generator"
echo "=========================================="
echo ""

# Create screenshots directory
SCREENSHOTS_DIR="screenshots/ipad-pro-13inch"
mkdir -p "$SCREENSHOTS_DIR"

echo "📁 Screenshots directory: $(pwd)/$SCREENSHOTS_DIR"
echo ""

# Check if Simulator is available
if ! command -v xcrun &> /dev/null; then
    echo "❌ Xcode Command Line Tools not found"
    echo "Please install: xcode-select --install"
    exit 1
fi

echo "✅ Xcode Command Line Tools found"
echo ""

# List available iPad simulators
echo "📱 Available iPad Simulators:"
xcrun simctl list devices available | grep -i "ipad pro" | grep -i "12.9" || echo "   No iPad Pro 12.9-inch found. Please download in Xcode."
echo ""

echo "📋 Instructions:"
echo "================"
echo ""
echo "1. Open Simulator:"
echo "   open -a Simulator"
echo ""
echo "2. Select iPad Pro 12.9-inch:"
echo "   Hardware > Device > iPad > iPad Pro (12.9-inch) (6th generation)"
echo ""
echo "3. Run your app:"
echo "   npx expo run:ios --device \"iPad Pro (12.9-inch)\""
echo ""
echo "4. Navigate through your app screens"
echo ""
echo "5. Take screenshots (Cmd + S in Simulator)"
echo "   - Screenshots will be saved to Desktop"
echo "   - Move them to: $SCREENSHOTS_DIR"
echo ""
echo "6. Required screenshots:"
echo "   - Home screen (main features)"
echo "   - Services/Search screen"
echo "   - Service details"
echo "   - Profile/Settings"
echo ""
echo "📐 Screenshot Requirements:"
echo "=========================="
echo "   - Size: 2048 x 2732 pixels (Portrait)"
echo "   - Format: PNG"
echo "   - Device frame: iPad Pro 12.9-inch (NOT iPhone)"
echo ""
echo "📤 Upload to App Store Connect:"
echo "==============================="
echo "   1. Go to: https://appstoreconnect.apple.com"
echo "   2. Your App > App Store > Version"
echo "   3. Screenshots section"
echo "   4. Select 'iPad Pro (12.9-inch) (6th generation)'"
echo "   5. Upload PNG files from: $SCREENSHOTS_DIR"
echo ""
echo "✅ Ready! Press any key to continue or Ctrl+C to exit..."
read -n 1

echo ""
echo "Opening Simulator..."
open -a Simulator




