# Device Tokens Export Script

ეს script-ი გაძლევთ საშუალებას device tokens-ის ამოსაღებად MongoDB ბაზიდან.

## 📋 მოთხოვნები

- Node.js >= 20.19.4
- `mongodb` package (უკვე დაყენებულია devDependencies-ში)

## 🚀 გამოყენება

### 1. ძირითადი გამოყენება

```bash
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db"
```

### 2. CSV ფორმატში ექსპორტი

```bash
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --format csv \
  --output tokens.csv
```

### 3. კონკრეტული user-ის tokens

```bash
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --user-id "user123"
```

### 4. კონკრეტული platform-ის tokens

```bash
# iOS tokens
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --platform ios

# Android tokens
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --platform android
```

### 5. Environment Variable-ით

```bash
MONGODB_URI="mongodb://localhost:27017" \
  node scripts/export-device-tokens.js \
  --database "marte_db"
```

### 6. npm script-ით

```bash
npm run export-tokens -- \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --format csv \
  --output tokens.csv
```

## 📝 პარამეტრები

| პარამეტრი | აღწერა | მაგალითი |
|-----------|--------|----------|
| `--uri` | MongoDB connection string | `mongodb://localhost:27017` |
| `--database` / `--db` | Database სახელი | `marte_db` |
| `--format` | ექსპორტის ფორმატი (json, csv, txt) | `csv` |
| `--output` / `-o` | Output ფაილის სახელი | `tokens.csv` |
| `--user-id` | კონკრეტული user-ის ID | `user123` |
| `--platform` | Platform (ios, android) | `ios` |
| `--collection` | Collection სახელი | `devices` |

## 📊 Output ფორმატები

### JSON (default)
```json
[
  {
    "_id": "...",
    "userId": "user123",
    "token": "fcm_token_here",
    "platform": "ios",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### CSV
```csv
userId,token,platform,createdAt,updatedAt
"user123","fcm_token_here","ios","2024-01-01T00:00:00.000Z","2024-01-01T00:00:00.000Z"
```

### TXT
```
fcm_token_1
fcm_token_2
fcm_token_3
```

## 🔍 Collection-ების ავტომატური მოძიება

Script ავტომატურად ეძებს tokens-ს შემდეგ collections-ში:
1. `devices` (default)
2. `device_tokens`
3. `devices`
4. `notifications`
5. `users`

თუ collection არ მოიძებნა, script გამოიტანს ხელმისაწვდომი collections-ის სიას.

## 📦 MongoDB Connection String Format

### Local MongoDB:
```
mongodb://localhost:27017
```

### MongoDB Atlas (Cloud):
```
mongodb+srv://username:password@cluster.mongodb.net/database
```

### MongoDB with Authentication:
```
mongodb://username:password@host:port/database?authSource=admin
```

## ⚠️ გაფრთხილებები

1. **Security**: არასოდეს commit-თ MongoDB credentials `.env` ფაილში ან code-ში
2. **Production**: Production-ზე გამოყენებამდე დარწმუნდით რომ სწორი database-ი გაქვთ
3. **Backup**: ექსპორტამდე გააკეთეთ backup

## 🐛 Troubleshooting

### Collection არ მოიძებნა
```bash
# ვნახოთ რა collections არსებობს
node scripts/export-device-tokens.js \
  --uri "mongodb://..." \
  --database "mydb" \
  --collection "YOUR_COLLECTION_NAME"
```

### Connection Error
- შეამოწმეთ MongoDB URI სწორია თუ არა
- შეამოწმეთ network access MongoDB Atlas-ზე (თუ cloud-ს იყენებთ)
- შეამოწმეთ user-ს აქვს შესაბამისი permissions

### Empty Results
- შეამოწმეთ query-ის პარამეტრები (user-id, platform)
- შეამოწმეთ collection-ში რეალურად არის tokens

## 📚 მაგალითები

### ყველა iOS tokens CSV-ში
```bash
node scripts/export-device-tokens.js \
  --uri "mongodb+srv://user:pass@cluster.mongodb.net/marte" \
  --database "marte" \
  --platform ios \
  --format csv \
  --output ios-tokens.csv
```

### კონკრეტული user-ის tokens JSON-ში
```bash
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --user-id "507f1f77bcf86cd799439011" \
  --format json \
  --output user-tokens.json
```

### მხოლოდ tokens (TXT)
```bash
node scripts/export-device-tokens.js \
  --uri "mongodb://localhost:27017" \
  --database "marte_db" \
  --format txt \
  --output tokens-only.txt
```


