# სამრეცხაოს სისტემის გაუმჯობესება

## დამატებული ფუნქციები

### 1. სერვისების დეტალური კონფიგურაცია
- **ფაილი**: `components/ui/ServicesConfig.tsx`
- **ფუნქცია**: სამრეცხაოსთვის სერვისების დეტალური კონფიგურაცია
- **მონაცემები**:
  - სერვისის სახელი
  - ფასი (ლარი)
  - ხანგრძლივობა (წუთებში)
  - აღწერა
- **API**: `GET/PATCH /carwash/locations/:id/services`

### 2. დროის სლოტების მართვა
- **ფაილი**: `components/ui/TimeSlotsConfig.tsx`
- **ფუნქცია**: სამრეცხაოსთვის დროის სლოტების კონფიგურაცია
- **მონაცემები**:
  - სამუშაო დღეები (ორშაბათი-კვირა)
  - სამუშაო საათები (დაწყება-დასრულება)
  - სლოტების ინტერვალი (15, 30, 60, 120 წუთი)
  - შესვენებები
- **API**: `GET/PATCH /carwash/locations/:id/time-slots-config`

### 3. რეალური დროის სტატუსი
- **ფაილი**: `components/ui/RealTimeStatusConfig.tsx`
- **ფუნქცია**: სამრეცხაოს რეალური დროის სტატუსის მართვა
- **მონაცემები**:
  - ღიაა/დახურულია
  - მიმდინარე ლოდინის დრო
  - რიგი
  - სავარაუდო ლოდინის დრო
- **API**: `GET/PATCH /carwash/locations/:id/status`

## ბექენდის ცვლილებები

### Entity განახლებები
- **ფაილი**: `backend/src/carwash/entities/carwash-location.entity.ts`
- **ახალი interfaces**:
  - `CarwashService` - სერვისების დეტალური ინფორმაცია
  - `TimeSlotsConfig` - დროის სლოტების კონფიგურაცია
  - `RealTimeStatus` - რეალური დროის სტატუსი
  - `DaySlots`, `TimeSlot` - დროის სლოტების მართვა

### Service განახლებები
- **ფაილი**: `backend/src/carwash/carwash.service.ts`
- **ახალი მეთოდები**:
  - `updateServices()` - სერვისების განახლება
  - `getServices()` - სერვისების მიღება
  - `updateTimeSlotsConfig()` - დროის სლოტების კონფიგურაცია
  - `generateAvailableSlots()` - ხელმისაწვდომი სლოტების გენერაცია
  - `bookTimeSlot()` - დროის სლოტის დაჯავშნა
  - `releaseTimeSlot()` - დროის სლოტის გათავისუფლება
  - `updateRealTimeStatus()` - რეალური დროის სტატუსის განახლება
  - `toggleOpenStatus()` - სტატუსის გადართვა

### Controller განახლებები
- **ფაილი**: `backend/src/carwash/carwash.controller.ts`
- **ახალი endpoints**:
  - `GET /carwash/locations/:id/services` - სერვისების მიღება
  - `PATCH /carwash/locations/:id/services` - სერვისების განახლება
  - `PATCH /carwash/locations/:id/time-slots-config` - დროის სლოტების კონფიგურაცია
  - `GET /carwash/locations/:id/available-slots` - ხელმისაწვდომი სლოტები
  - `POST /carwash/locations/:id/book-slot` - დროის სლოტის დაჯავშნა
  - `POST /carwash/locations/:id/release-slot` - დროის სლოტის გათავისუფლება
  - `GET /carwash/locations/:id/status` - რეალური დროის სტატუსი
  - `PATCH /carwash/locations/:id/status` - რეალური დროის სტატუსის განახლება
  - `PATCH /carwash/locations/:id/toggle-open` - სტატუსის გადართვა
  - `PATCH /carwash/locations/:id/wait-time` - ლოდინის დროის განახლება

## ფრონტენდის ცვლილებები

### AddModal განახლებები
- **ფაილი**: `components/ui/AddModal.tsx`
- **ახალი ველები**:
  - `detailedServices` - დეტალური სერვისები
  - `timeSlotsConfig` - დროის სლოტების კონფიგურაცია
  - `realTimeStatus` - რეალური დროის სტატუსი

### ახალი კომპონენტები
- **ServicesConfig.tsx** - სერვისების კონფიგურაცია
- **TimeSlotsConfig.tsx** - დროის სლოტების კონფიგურაცია
- **RealTimeStatusConfig.tsx** - რეალური დროის სტატუსის კონფიგურაცია

## გამოყენება

### სამრეცხაოს დამატება
1. გახსენით AddModal
2. აირჩიეთ "სამრეცხაო"
3. შეავსეთ ძირითადი ინფორმაცია
4. კონფიგურირება:
   - დეტალური სერვისები
   - დროის სლოტები
   - რეალური დროის სტატუსი
5. შენახვა

### API გამოყენება
```typescript
// სერვისების მიღება
const services = await carwashApi.getServices(locationId);

// დროის სლოტების კონფიგურაცია
const timeSlots = await carwashApi.updateTimeSlotsConfig(locationId, config);

// რეალური დროის სტატუსი
const status = await carwashApi.updateRealTimeStatus(locationId, statusData);
```

## Backward Compatibility
ყველა ახალი ველი optional-ია და არ არღვევს არსებულ ფუნქციონალს. ძველი ველები (`services`, `workingHours`, `isOpen`) შენარჩუნებულია backward compatibility-ისთვის.
