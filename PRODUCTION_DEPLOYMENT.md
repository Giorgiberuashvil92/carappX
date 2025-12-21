# 🚀 Production Deployment Checklist

## API URLs Configuration

### ✅ Mobile App (React Native)
**File:** `config/api.ts`
- **Production:** `https://marte-backend-production.up.railway.app`
- **Status:** ✅ Configured correctly
- Production build-ში ავტომატურად production URL-ს იყენებს

### ✅ Admin Dashboard (Next.js)
**File:** `free-nextjs-admin-dashboard/src/lib/api.ts`
- **Production:** `https://marte-backend-production.up.railway.app`
- **Status:** ✅ Configured correctly
- Production-ში ავტომატურად production URL-ს იყენებს

### ✅ Admin Dashboard Proxy
**File:** `free-nextjs-admin-dashboard/src/app/api/proxy/[...path]/route.ts`
- **Production:** `https://marte-backend-production.up.railway.app`
- **Status:** ✅ Configured correctly
- Production-ში ავტომატურად production URL-ს იყენებს

## Deployment Steps

### 1. Mobile App (Expo)
```bash
# Build production
npm run build:ios:production    # iOS
npm run build:android:production # Android

# ან EAS Build
eas build --platform all --profile production
```

### 2. Admin Dashboard (Next.js)
```bash
cd free-nextjs-admin-dashboard
npm run build
npm run start  # ან deploy to Vercel/Railway
```

### 3. Backend (NestJS)
```bash
cd marte-backend
# Deploy to Railway (უკვე deployed)
# URL: https://marte-backend-production.up.railway.app
```

## Environment Variables

### Mobile App
- `EXPO_PUBLIC_API_URL` - optional override (default: production URL)

### Admin Dashboard
- `NEXT_PUBLIC_BACKEND_URL` - optional override (default: production URL)

### Backend
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 3000)
- Other environment variables as needed

## Verification

### Test Production URLs:
1. ✅ Mobile App → `https://marte-backend-production.up.railway.app`
2. ✅ Admin Dashboard → `https://marte-backend-production.up.railway.app`
3. ✅ Backend → `https://marte-backend-production.up.railway.app`

## Notes

- Development mode-ში localhost/development URLs გამოიყენება
- Production build-ში ავტომატურად production URLs გამოიყენება
- Environment variables-ით შეიძლება override-ი

