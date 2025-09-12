# 🚗 Car Wash API - სატესტო მონაცემები

## 📋 რა შეიცავს

### 🏢 **5 სამრეცხაო ლოკაცია:**
- **CAR WASH CENTER** - რუსთაველის გამზირი 15
- **ALL CLEAN** - აღმაშენებლის გამზირი 45  
- **LUCKY WASH** - ვაზისუბნის ქუჩა 12
- **SPARKLE CLEAN** - პეკინის ქუჩა 8
- **PREMIUM WASH** - წერეთლის გამზირი 25

### 🛠️ **16 სერვისი:**
- სრული სამრეცხაო (15-20₾)
- პრემიუმ სამრეცხაო (35-60₾)
- ძრავის წმენდა (25-40₾)
- ვაქსირება (20-30₾)
- დეტეილინგი (80₾)

### 📅 **5 სატესტო ჯავშანი:**
- **user_123** - 3 ჯავშანი (confirmed, pending, completed)
- **user_456** - 1 ჯავშანი (confirmed)
- **user_789** - 1 ჯავშანი (pending)

## 🚀 როგორ გამოვიყენოთ

### 1️⃣ **Backend-ის გაშვება:**
```bash
cd backend
npm run start:dev
```

### 2️⃣ **სატესტო მონაცემების ჩაგდება:**
```bash
# ყველა მონაცემის ჩაგდება
node seed-carwash.js

# ან API endpoint-ით
curl -X POST http://localhost:4000/carwash/seed/all
```

### 3️⃣ **API ტესტირება:**
```bash
# ყველა endpoint-ის ტესტირება
node test-carwash-api.js
```

## 📡 **API Endpoints**

### **Bookings:**
- `GET /carwash/bookings` - ყველა ჯავშანი
- `GET /carwash/bookings?userId=user_123` - მომხმარებლის ჯავშნები
- `GET /carwash/bookings/:id` - კონკრეტული ჯავშანი
- `POST /carwash/bookings` - ახალი ჯავშანი
- `PATCH /carwash/bookings/:id` - ჯავშნის განახლება
- `DELETE /carwash/bookings/:id` - ჯავშნის წაშლა

### **Booking Actions:**
- `PATCH /carwash/bookings/:id/cancel` - ჯავშნის გაუქმება
- `PATCH /carwash/bookings/:id/confirm` - ჯავშნის დადასტურება
- `PATCH /carwash/bookings/:id/start` - ჯავშნის დაწყება
- `PATCH /carwash/bookings/:id/complete` - ჯავშნის დასრულება

### **Filtering:**
- `GET /carwash/locations/:locationId/bookings` - ლოკაციის ჯავშნები
- `GET /carwash/bookings/date/:date` - თარიღის ჯავშნები

### **Seed Data:**
- `POST /carwash/seed/locations` - ლოკაციების ჩაგდება
- `POST /carwash/seed/services` - სერვისების ჩაგდება
- `POST /carwash/seed/bookings` - ჯავშნების ჩაგდება
- `POST /carwash/seed/all` - ყველაფრის ჩაგდება

## 📱 **Frontend Integration**

### **API Service:**
```typescript
import { carwashApi } from '../services/carwashApi';

// ჯავშნების ჩატვირთვა
const bookings = await carwashApi.getAllBookings('user_123');

// ახალი ჯავშანი
const newBooking = await carwashApi.createBooking(bookingData);

// ჯავშნის განახლება
const updated = await carwashApi.confirmBooking('booking_id');
```

### **State Management:**
```typescript
const [userBookings, setUserBookings] = useState<CarwashBooking[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  loadUserBookings();
}, []);

const loadUserBookings = async () => {
  try {
    setLoading(true);
    const bookings = await carwashApi.getAllBookings('user_123');
    setUserBookings(bookings);
  } catch (error) {
    console.error('Error loading bookings:', error);
  } finally {
    setLoading(false);
  }
};
```

## 🎯 **ტესტირების სცენარიები**

### **1. ჯავშნების ჩატვირთვა:**
```bash
curl http://localhost:4000/carwash/bookings?userId=user_123
```

### **2. ახალი ჯავშანი:**
```bash
curl -X POST http://localhost:4000/carwash/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "locationId": "location_1",
    "locationName": "CAR WASH CENTER",
    "serviceName": "სრული სამრეცხაო",
    "servicePrice": 15,
    "bookingDate": 1704067200000,
    "bookingTime": "14:30",
    "carInfo": {
      "make": "Toyota",
      "model": "Camry",
      "year": "2020",
      "licensePlate": "TB-123-AB"
    },
    "customerInfo": {
      "name": "გიორგი ნათაძე",
      "phone": "+995 555 123 456"
    }
  }'
```

### **3. ჯავშნის დადასტურება:**
```bash
curl -X PATCH http://localhost:4000/carwash/bookings/booking_1/confirm
```

## 🔧 **Development Commands**

```bash
# Backend გაშვება
npm run start:dev

# ყველა მონაცემის ჩაგდება
node seed-carwash.js

# API ტესტირება
node test-carwash-api.js

# Linting
npm run lint

# Build
npm run build
```

## 📊 **Database Collections**

### **carwash_locations:**
- ლოკაციების ინფორმაცია
- მისამართები, ტელეფონები, რეიტინგები
- სერვისები, სამუშაო საათები

### **carwash_services:**
- სერვისების ინფორმაცია
- ფასები, ხანგრძლივობა, კატეგორიები

### **carwash_bookings:**
- ჯავშნების ინფორმაცია
- მომხმარებლის და მანქანის მონაცემები
- სტატუსები და თარიღები

## 🎉 **მზადაა!**

ახლა შეგიძლიათ:
- ✅ სამრეცხაო ლოკაციების ნახვა
- ✅ ჯავშნების შექმნა და მართვა
- ✅ Real-time status updates
- ✅ Frontend-backend integration
- ✅ API ტესტირება

**Happy Coding! 🚗✨**
