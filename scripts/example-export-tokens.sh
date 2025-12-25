#!/bin/bash

# Device Tokens Export - მაგალითი
# 
# ეს script გაჩვენებთ როგორ გამოიყენოთ export-device-tokens.js

# 1. ძირითადი გამოყენება (JSON)
echo "📱 ყველა device token-ის ექსპორტი JSON-ში..."
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --format json \
  --output device-tokens.json

# 2. CSV ფორმატში
echo "📱 CSV ფორმატში ექსპორტი..."
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --format csv \
  --output device-tokens.csv

# 3. მხოლოდ iOS tokens
echo "📱 iOS tokens-ის ექსპორტი..."
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --platform ios \
  --format csv \
  --output ios-tokens.csv

# 4. კონკრეტული user-ის tokens
echo "📱 User-ის tokens-ის ექსპორტი..."
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --user-id "YOUR_USER_ID" \
  --format json \
  --output user-tokens.json

# 5. Environment variable-ით
echo "📱 Environment variable-ით..."
MONGODB_URI="mongodb://localhost:27017" \
  node scripts/export-device-tokens.js \
  --database "marte_db" \
  --format csv \
  --output tokens.csv

echo "✅ ექსპორტი დასრულდა!"


