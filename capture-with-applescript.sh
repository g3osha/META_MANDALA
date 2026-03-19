#!/bin/bash

# Create screenshots directory
mkdir -p screenshots

echo "🚀 Opening browser and capturing screenshots..."

# Open URL in Safari
osascript <<EOF
tell application "Safari"
    activate
    make new document with properties {URL:"http://localhost:8889"}
    delay 3
end tell

tell application "System Events"
    keystroke "f" using {command down, control down}
    delay 1
end tell
EOF

echo "📸 Taking screenshot 1: Initial load..."
screencapture -x screenshots/01-initial-load.png
sleep 1

# Click ASCII button
osascript <<EOF
tell application "System Events"
    keystroke "a"
    delay 1
end tell
EOF

echo "📸 Taking screenshot 2: ASCII toggled..."
screencapture -x screenshots/02-ascii-toggled.png
sleep 1

# Click RANDOM button
osascript <<EOF
tell application "System Events"
    keystroke "r"
    delay 2
end tell
EOF

echo "📸 Taking screenshot 3: Random mandala..."
screencapture -x screenshots/03-random-mandala.png
sleep 1

# Click ASCII button again
osascript <<EOF
tell application "System Events"
    keystroke "a"
    delay 1
end tell
EOF

echo "📸 Taking screenshot 4: ASCII on random..."
screencapture -x screenshots/04-ascii-on-random.png

echo "✨ Done! Screenshots saved to screenshots/"
ls -lh screenshots/
