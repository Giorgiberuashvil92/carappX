#!/bin/bash

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 გახსნა ტერმინალები..."

# Try using osascript with proper syntax
osascript <<EOF 2>/dev/null
tell application "Terminal"
    activate
    
    -- Terminal 1: Backend
    tell application "System Events"
        keystroke "t" using command down
    end tell
    delay 0.3
    do script "cd '$PROJECT_ROOT/backend-v2' && echo '=== Backend Server ===' && npm run start:dev" in front window
    
    -- Terminal 2: Frontend
    tell application "System Events"
        keystroke "t" using command down
    end tell
    delay 0.3
    do script "cd '$PROJECT_ROOT' && echo '=== Frontend/Expo ===' && npm start" in front window
end tell
EOF

if [ $? -eq 0 ]; then
    echo "✅ ტერმინალები გახსნილია!"
else
    echo "⚠️  ავტომატური გახსნა ვერ მოხერხდა (საჭიროა Terminal permissions)"
    echo ""
    echo "📋 გახსენი ხელით ახალი ტერმინალები:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd $PROJECT_ROOT/backend-v2"
    echo "  npm run start:dev"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd $PROJECT_ROOT"
    echo "  npm start"
    echo ""
    echo "💡 macOS-ზე permissions-ის მისაცემად:"
    echo "   System Preferences → Security & Privacy → Privacy → Accessibility"
    echo "   დაამატე Terminal ან iTerm2"
fi

echo ""
echo "ტერმინალები:"
echo "  1. Backend Server (backend-v2) - npm run start:dev"
echo "  2. Frontend/Expo (root) - npm start"

