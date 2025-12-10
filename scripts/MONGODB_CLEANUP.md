# MongoDB Database Cleanup Script

ეს script-ი გაძლევთ საშუალებას MongoDB ბაზის გასუფთავებისა და მართვისთვის.

## ინსტალაცია

ჯერ დააყენეთ `mongodb` package:

```bash
npm install
# ან
yarn install
```

## გამოყენება

### 1. Collections-ის სიის ნახვა (ყველა documents-ით)

```bash
node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb"
```

ან environment variable-ით:

```bash
MONGODB_URI="mongodb://..." node scripts/clean-mongodb.js --database "mydb"
```

### 2. DRY RUN (მხოლოდ preview, არაფერი არ შეიცვლება)

```bash
node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --dry-run
```

### 3. კონკრეტული Collections-ის გასუფთავება

```bash
node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --collections "users,cars,bookings" --yes
```

### 4. ყველა Collections-ის გასუფთავება

```bash
node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --yes
```

⚠️ **გაფრთხილება**: ეს წაშლის ყველა documents-ს ყველა collections-ში!

### 5. მთელი Database-ის წაშლა

```bash
node scripts/clean-mongodb.js --uri "mongodb://..." --database "mydb" --drop-database --yes
```

⚠️ **გაფრთხილება**: ეს სრულად წაშლის database-ს!

### 6. ყველა Databases-ის სიის ნახვა

```bash
node scripts/clean-mongodb.js --uri "mongodb://..." --drop-database --dry-run
```

## პარამეტრები

- `--uri` ან `MONGODB_URI`: MongoDB connection string
- `--database` ან `--db`: Database-ის სახელი
- `--collections`: Collections-ის სია (comma-separated), მაგ: `"users,cars,bookings"`
- `--dry-run`: მხოლოდ preview, არაფერი არ შეიცვლება
- `--drop-database`: მთელი database-ის წაშლა
- `--yes` ან `-y`: Confirmation-ის გარეშე გაგრძელება

## მაგალითები

### მაგალითი 1: Collections-ის ნახვა

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" \
  node scripts/clean-mongodb.js --database "mydb"
```

### მაგალითი 2: Preview რა წაიშლება

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" \
  node scripts/clean-mongodb.js --database "mydb" --dry-run
```

### მაგალითი 3: კონკრეტული Collections-ის გასუფთავება

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" \
  node scripts/clean-mongodb.js \
  --database "mydb" \
  --collections "users,cars" \
  --yes
```

### მაგალითი 4: npm script-ით

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" \
  npm run clean-mongodb -- --database "mydb" --dry-run
```

## გაფრთხილებები

1. ⚠️ **Backup**: გასუფთავებამდე გააკეთეთ backup!
2. ⚠️ **Production**: Production-ზე გამოყენებამდე დარწმუნდით რომ სწორი database-ი გაქვთ!
3. ⚠️ **Confirmation**: `--yes` flag-ის გარეშე script-ი არ გაასუფთავებს - ეს არის safety feature!

## MongoDB Connection String Format

### Local MongoDB:
```
mongodb://localhost:27017/mydb
```

### MongoDB Atlas (Cloud):
```
mongodb+srv://username:password@cluster.mongodb.net/mydb
```

### MongoDB with Authentication:
```
mongodb://username:password@host:port/mydb?authSource=admin
```

## Troubleshooting

### Connection Error
თუ connection error-ი გაქვთ, შეამოწმეთ:
- Connection string სწორია თუ არა
- Network access MongoDB Atlas-ზე (თუ cloud-ს იყენებთ)
- Credentials სწორია თუ არა

### Permission Error
თუ permission error-ი გაქვთ, შეამოწმეთ:
- User-ს აქვს შესაბამისი permissions database-ზე
- Database-ის სახელი სწორია თუ არა

## უსაფრთხოების რეკომენდაციები

1. **არასოდეს commit-თ MongoDB credentials** `.env` ფაილში ან code-ში
2. **გამოიყენეთ environment variables** production-ში
3. **გააკეთეთ backup** მნიშვნელოვანი data-ს
4. **გამოიყენეთ `--dry-run`** პირველად

