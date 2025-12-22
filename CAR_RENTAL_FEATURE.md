# 🚗 Car Rental Feature - მანქანების გაქირავების ფუნქციონალი

## 📋 Overview

სრული **Car Rental** (მანქანების გაქირავება) ფუნქციონალი Marte აპლიკაციისთვის.

---

## 🏗️ Backend (NestJS + MongoDB)

### 📂 ფაილები

1. **Schema**: `marte-backend/src/schemas/car-rental.schema.ts`
   - მონაცემთა სტრუქტურა MongoDB-სთვის
   - 25+ ველი: brand, model, year, price, images, features, location, etc.
   - Indexes for performance

2. **Service**: `marte-backend/src/car-rental/car-rental.service.ts`
   - Business logic
   - CRUD operations
   - Filtering, sorting, pagination
   - Booking functionality
   - Availability checking

3. **Controller**: `marte-backend/src/car-rental/car-rental.controller.ts`
   - REST API endpoints
   - Request/response handling

4. **Module**: `marte-backend/src/car-rental/car-rental.module.ts`
   - Module configuration

---

## 🌐 API Endpoints

### 1. **Get All Rental Cars**
```
GET /car-rental?location=თბილისი&category=ლუქსი&sortBy=rating&order=desc&limit=50
```

**Query Parameters:**
- `location` - მდებარეობა (optional)
- `category` - კატეგორია: "ეკონომი", "კომფორტი", "ლუქსი", "SUV", "მინივენი" (optional)
- `minPrice` - მინიმალური ფასი დღეში (optional)
- `maxPrice` - მაქსიმალური ფასი დღეში (optional)
- `transmission` - "მექანიკა" ან "ავტომატიკა" (optional)
- `fuelType` - "ბენზინი", "დიზელი", "ჰიბრიდი", "ელექტრო" (optional)
- `seats` - ადგილების რაოდენობა (optional)
- `sortBy` - "price", "rating", "date" (default: "date")
- `order` - "asc", "desc" (default: "desc")
- `limit` - რაოდენობა (default: 50)
- `available` - "true" ან "false" (optional)

### 2. **Get Popular Rental Cars**
```
GET /car-rental/popular?limit=10
```

### 3. **Get Recent Rental Cars**
```
GET /car-rental/recent?limit=10
```

### 4. **Get Single Rental Car**
```
GET /car-rental/:id
```

### 5. **Create Rental Car**
```
POST /car-rental
Content-Type: application/json

{
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "category": "კომფორტი",
  "pricePerDay": 150,
  "images": ["url1", "url2"],
  "transmission": "ავტომატიკა",
  "fuelType": "ჰიბრიდი",
  "seats": 5,
  "location": "თბილისი",
  "phone": "+995 555 123 456",
  ...
}
```

### 6. **Update Rental Car**
```
PUT /car-rental/:id
Content-Type: application/json

{ "pricePerDay": 140, "available": true }
```

### 7. **Delete Rental Car**
```
DELETE /car-rental/:id
```

### 8. **Book Rental Car**
```
POST /car-rental/:id/book
Content-Type: application/json

{
  "startDate": "2024-12-25",
  "endDate": "2024-12-30"
}
```

### 9. **Cancel Booking**
```
POST /car-rental/:id/cancel
Content-Type: application/json

{
  "startDate": "2024-12-25",
  "endDate": "2024-12-30"
}
```

### 10. **Check Availability**
```
GET /car-rental/:id/availability?startDate=2024-12-25&endDate=2024-12-30
```

---

## 📱 Frontend (React Native + Expo)

### 📂 ფაილები

1. **Component**: `components/ui/CarRentalCard.tsx`
   - მანქანის ბარათი (card)
   - იჩენს: სურათი, ფასი, სპეციფიკაციები, რეიტინგი
   - Beautiful modern design

2. **Home Screen Integration**: `app/(tabs)/index.tsx`
   - Car Rental სექცია home page-ზე
   - Horizontal scroll
   - პოპულარული სერვისების წინ

3. **Detail Screen**: `app/car-rental/[id].tsx`
   - დეტალური ინფორმაცია მანქანის შესახებ
   - Image gallery
   - Features, specs, location
   - Booking modal
   - Price calculator

4. **List Screen**: `app/car-rental-list.tsx`
   - ყველა მანქანის სია
   - კატეგორიის ფილტრები
   - Pull to refresh
   - Empty state

---

## 🎨 UI Features

### CarRentalCard Component
- ✅ High-quality image
- ✅ Availability badge (ხელმისაწვდომი/დაკავებული)
- ✅ Category badge (ეკონომი, ლუქსი, etc.)
- ✅ Rating with stars
- ✅ Specs: transmission, fuel type, seats
- ✅ Features chips
- ✅ Location
- ✅ Price per day (+ weekly price)
- ✅ Book button

### Detail Screen Features
- ✅ Image gallery with indicators
- ✅ Back button
- ✅ Availability badge
- ✅ Title section (brand, model, year, category)
- ✅ Rating
- ✅ Specs card (transmission, fuel, seats)
- ✅ Price card (per day, week, deposit)
- ✅ Description
- ✅ Features grid
- ✅ Extras (child seat, GPS, insurance, etc.)
- ✅ Location with map icon
- ✅ Contact buttons (phone, email)
- ✅ Bottom booking bar
- ✅ Booking modal with day selector
- ✅ Total price calculator

---

## 🗄️ Database Schema

```typescript
{
  brand: string;              // "Toyota", "Mercedes", etc.
  model: string;              // "Camry", "E-Class", etc.
  year: number;               // 2023, 2024, etc.
  category: string;           // "ეკონომი", "კომფორტი", "ლუქსი", "SUV", "მინივენი"
  pricePerDay: number;        // ფასი დღეში (GEL)
  pricePerWeek?: number;      // ფასი კვირაში (GEL)
  pricePerMonth?: number;     // ფასი თვეში (GEL)
  images: string[];           // სურათების URL-ები
  description: string;        // აღწერა
  features: string[];         // ["GPS", "Bluetooth", "კონდიციონერი"]
  transmission: string;       // "მექანიკა" | "ავტომატიკა"
  fuelType: string;           // "ბენზინი", "დიზელი", "ჰიბრიდი", "ელექტრო"
  seats: number;              // ადგილების რაოდენობა
  location: string;           // "თბილისი", "ბათუმი", etc.
  address?: string;           // ზუსტი მისამართი
  phone: string;              // საკონტაქტო ტელეფონი
  email?: string;
  ownerId?: string;
  ownerName?: string;
  available: boolean;         // ხელმისაწვდომია თუ არა
  rating: number;             // 0-5
  reviews: number;            // მიმოხილვების რაოდენობა
  totalBookings: number;      // სულ დაჯავშნები
  unavailableDates: string[]; // დაკავებული თარიღები
  deposit: number;            // დეპოზიტი
  extras?: {
    childSeat?: number;       // ბავშვის სავარძელი (₾/დღე)
    additionalDriver?: number; // დამატებითი მძღოლი
    navigation?: number;       // GPS
    insurance?: number;        // დაზღვევა
  };
  isActive: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🌱 Seeding Data (Optional)

### ტესტური მონაცემების დამატება:

თუ გსურთ სწრაფად დაამატოთ ტესტური მონაცემები:

1. **Backend-ში შესვლა:**
```bash
cd marte-backend
```

2. **Seed Script-ის გაშვება:**
```bash
node seed-rental-cars.js
```

ეს დაამატებს 6 ტესტურ მანქანას:
- Toyota Camry 2023 (კომფორტი) - 150₾/დღე
- Mercedes E-Class 2024 (ლუქსი) - 300₾/დღე
- BMW X5 2023 (SUV) - 280₾/დღე
- Hyundai Elantra 2022 (ეკონომი) - 100₾/დღე
- VW Transporter 2023 (მინივენი) - 200₾/დღე
- Audi A6 2024 (ლუქსი) - 320₾/დღე

**⚠️ შენიშვნა**: Mobile app-ში statikuri fallback data წაშლილია. ყველა მონაცემი backend-იდან ჩაიტვირთება დინამიურად!

---

## 🎛️ Admin Panel

### 📂 Files:

1. **Main Page**: `free-nextjs-admin-dashboard/src/app/(admin)/car-rentals/page.tsx`
   - Grid view with cards
   - Stats dashboard (Total, Available, Bookings, Avg Price)
   - Search by brand/model/location
   - Category filters
   - Edit/Delete actions

2. **New Car Page**: `free-nextjs-admin-dashboard/src/app/(admin)/car-rentals/new/page.tsx`
   - Complete form with all fields
   - Image upload (Cloudinary)
   - Features management
   - Form validation

3. **Edit Car Page**: `free-nextjs-admin-dashboard/src/app/(admin)/car-rentals/[id]/page.tsx`
   - Load existing data
   - Update form
   - Same interface as New page

4. **Sidebar Menu**: Added "Car Rentals" link

### ✨ Admin Features:

- ✅ **CRUD Operations**: Create, Read, Update, Delete
- ✅ **Image Upload**: Cloudinary integration
- ✅ **Search & Filters**: By brand, model, location, category
- ✅ **Stats Dashboard**: Real-time statistics
- ✅ **Form Validation**: Required fields validation
- ✅ **Loading States**: Spinner & feedback
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Responsive Design**: Works on all devices

### 🎯 Admin Access:

```
http://localhost:3000/car-rentals
```

---

## 🚀 How to Use

### Backend Setup

1. **დარწმუნდი რომ MongoDB მუშაობს**
2. **დაამატე CarRentalModule app.module.ts-ში** (უკვე დამატებულია ✅)
3. **Backend გაშვება:**
```bash
cd marte-backend
npm run start:dev
```

4. **Test data-ს დამატება:**
```bash
node seed-rental-cars.js
```

### Frontend Setup

1. **შეამოწმე რომ backend მუშაობს:**
```bash
curl http://localhost:4000/car-rental/popular
```

2. **Frontend გაშვება:**
```bash
npm start
```

3. **აპში ნახვა:**
   - Home screen-ზე გამოჩნდება "მანქანების გაქირავება" სექცია
   - Scroll-ით ნახე მანქანები
   - დააჭირე ნებისმიერ ბარათს დეტალური ინფორმაციისთვის
   - დააჭირე "დაჯავშნა" ღილაკს booking modal-ისთვის

---

## 📝 Workflow - როგორ ვამატოთ მანქანები

### 🔄 **Admin → Mobile Pipeline:**

1. **Admin Panel-ში შედი:**
   ```
   http://localhost:3000/car-rentals
   ```

2. **დააჭირე "+ Add New Car"**

3. **შეავსე ყველა ველი:**
   - **Basic Info**: ბრენდი (Toyota), მოდელი (Camry), წელი (2023), კატეგორია
   - **Specs**: ტრანსმისია, საწვავი, ადგილები
   - **Pricing**: ფასი დღეში/კვირაში/თვეში, დეპოზიტი
   - **Location**: ქალაქი, ტელეფონი, მისამართი
   - **Features**: დაამატე (GPS, Bluetooth, კონდიციონერი...)
   - **Images**: ატვირთე სურათები

4. **"დამატება" ღილაკი** → მონაცემები backend-ში ინახება

5. **Mobile App-ში ავტომატურად ჩნდება!** 
   - Home screen-ზე "მანქანების გაქირავება" სექციაში
   - "ყველა" გვერდზე
   - Search results-ში

### ⚡ **No Static Data!**
- ✅ Mobile app-ში აღარ არის hardcoded fallback data
- ✅ ყველაფერი backend-იდან იტვირთება დინამიურად
- ✅ Admin panel-ში შეცვლილი - Mobile app-ში დაუყოვნებლივ ჩანს!

---

## ✨ Key Features

### ✅ Backend
- [x] Full CRUD operations
- [x] Advanced filtering & sorting
- [x] Booking system with date management
- [x] Availability checking
- [x] Popular & recent cars
- [x] Performance optimized with indexes
- [x] TypeScript support
- [x] Error handling

### ✅ Frontend
- [x] Beautiful modern UI
- [x] Home screen integration
- [x] Detailed car view
- [x] List with filters
- [x] Booking modal
- [x] Price calculator
- [x] Image gallery
- [x] Pull to refresh
- [x] Empty states
- [x] Loading states
- [x] Toast notifications
- [x] Navigation

---

## 🎯 Future Enhancements

შესაძლო გაუმჯობესებები მომავალში:
- [ ] Calendar view for date selection
- [ ] Map integration for car location
- [ ] Reviews and ratings system
- [ ] Payment integration (BOG)
- [ ] Push notifications for bookings
- [ ] Favorites/Wishlist
- [ ] Search by brand/model
- [ ] Car comparison feature
- [ ] User profile with booking history
- [ ] Partner dashboard for car owners
- [ ] Photo upload functionality
- [ ] Car condition reports
- [ ] Insurance verification
- [ ] Driver's license verification

---

## 📸 Screenshots

### Home Screen
- Car Rental სექცია პოპულარული სერვისების წინ
- Horizontal scroll
- Beautiful cards

### Detail Screen
- Image gallery
- All car specs
- Features list
- Booking button

### List Screen
- Category filters
- All available cars
- Pull to refresh

---

## 🤝 Contributing

თუ გინდა რაიმე დაამატო ან გააუმჯობესო:
1. ახალი ფიჩრების იდეები მოგვიგზავნე
2. Bug reports
3. Pull requests are welcome!

---

## 📞 Support

კითხვების შემთხვევაში დაგვიკავშირდით:
- Email: support@marte.ge
- Phone: +995 555 000 000

---

**🎉 Ready to use! Enjoy the Car Rental feature!**

