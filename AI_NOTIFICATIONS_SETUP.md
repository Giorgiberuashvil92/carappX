# 🤖 AI-Based Push Notifications Setup

## ✅ რა გავაკეთეთ:

### 1. **AINotificationsService** შეიქმნა
📁 `backend-v2/src/ai/ai-notifications.service.ts`

#### ფუნქციები:
- `calculateMatchConfidence()` - გამოთვლის confidence score (0-1) part-სა და request-ს შორის
- `checkMatchingRequestsForNewPart()` - როცა ახალი ნაწილი ემატება, ამოწმებს არსებულ requests
- `checkMatchingPartsForNewRequest()` - როცა ახალი request იქმნება, ამოწმებს არსებულ parts
- `sendAIRecommendationNotification()` - აგზავნის AI recommendations

#### Confidence Scoring Logic:
```typescript
- Make match: 30% (ზუსტი) ან 15% (ნაწილობრივი)
- Model match: 30% (ზუსტი) ან 15% (ნაწილობრივი)  
- Year match: 20% (ზუსტი) ან 10% (±2 წელი)
- Part name match: 20%
```

**Threshold:** confidence >= 60% → გაიგზავნება push notification

---

### 2. **PartsService** განახლდა
📁 `backend-v2/src/parts/parts.service.ts`

```typescript
async create(createPartDto: CreatePartDto): Promise<Part> {
  const savedPart = await createdPart.save();
  
  // 🤖 AI: შეამოწმე არსებული requests
  await this.aiNotificationsService.checkMatchingRequestsForNewPart(savedPart);
  
  return savedPart;
}
```

**როცა store ამატებს ახალ ნაწილს:**
1. ნაწილი ინახება database-ში
2. AI ამოწმებს ყველა active request-ს
3. თუ confidence >= 60%, მომხმარებელს მიდის push notification

---

### 3. **Module Setup**
- `AIModule` - დაემატა `AINotificationsService`
- `PartsModule` - import `AIModule` (forwardRef)
- `NotificationsModule` - უკვე exports `NotificationsService`

---

## 📱 Notification Types:

### Type 1: New Part Match
**როცა:** Store ამატებს ნაწილს რომელიც ემთხვევა user-ის request-ს

```json
{
  "title": "✨ ახალი შესატყვისი ნაწილი!",
  "body": "BMW X5 - ძრავა (2500₾)",
  "data": {
    "type": "ai_part_match",
    "partId": "...",
    "requestId": "...",
    "confidence": "0.85",
    "matchReasons": "✓ მარკა ემთხვევა, ✓ მოდელი ემთხვევა...",
    "screen": "PartDetails"
  }
}
```

### Type 2: Request Match  
**როცა:** User ქმნის request-ს და უკვე არსებობს შესაბამისი parts

```json
{
  "title": "🎯 იდეალური შესატყვისი ვიპოვეთ!",
  "body": "3 შესაბამისი ძრავა - საუკეთესო: 85% match",
  "data": {
    "type": "ai_request_match",
    "requestId": "...",
    "matchCount": "3",
    "topPartId": "...",
    "confidence": "0.85",
    "screen": "RequestDetails"
  }
}
```

### Type 3: AI Recommendations
**როცა:** AI აგენერირებს high-confidence recommendations

```json
{
  "title": "🤖 AI რეკომენდაციები",
  "body": "ვიპოვეთ 5 შესაბამისი ძრავა",
  "data": {
    "type": "ai_recommendations",
    "requestId": "...",
    "recommendationCount": "5",
    "topRecommendations": "[...]",
    "screen": "AIRecommendations"
  }
}
```

---

## 🔄 როგორ მუშაობს:

### Scenario 1: Store ამატებს ნაწილს
```
1. POST /parts → PartsService.create()
2. Part ინახება database-ში
3. AINotificationsService.checkMatchingRequestsForNewPart()
4. იპოვება active requests (make/model match)
5. ითვლება confidence score თითოეულისთვის
6. თუ confidence >= 60% → Push Notification
```

### Scenario 2: User ქმნის Request-ს
```
1. POST /requests → RequestsService.create()
2. Request ინახება database-ში
3. AINotificationsService.checkMatchingPartsForNewRequest()
4. იპოვება არსებული parts (make/model match)
5. ითვლება confidence score თითოეულისთვის
6. თუ confidence >= 60% → Push Notification
```

---

## 🎯 Confidence Score Examples:

### Example 1: Perfect Match (100%)
```
Request: BMW X5 2020 - ძრავა
Part: BMW X5 2020 - ძრავა
Score: 0.3 + 0.3 + 0.2 + 0.2 = 1.0 (100%)
```

### Example 2: Good Match (80%)
```
Request: BMW X5 2020 - ძრავა  
Part: BMW X5 2019 - ძრავა
Score: 0.3 + 0.3 + 0.1 + 0.2 = 0.9 (90%)
```

### Example 3: Partial Match (45% - No Notification)
```
Request: BMW X5 2020 - ძრავა
Part: BMW X3 2020 - ძრავა  
Score: 0.3 + 0.15 + 0.2 + 0.2 = 0.85 (85%)
```

---

## 📊 Console Logs:

```bash
🤖 [AI-NOTIFY] Checking matching requests for new part: { partId, make, model, name }
🔍 [AI-NOTIFY] Found 5 potential matching requests
📊 [AI-NOTIFY] Match confidence for request 123: 85%
✅ [AI-NOTIFY] Sent notification to user abc (confidence: 85%)
```

---

## 🚀 რა დარჩა გასაკეთებელი:

### Backend:
1. ❌ **RequestsService** - დაამატე AI notification call როცა request იქმნება
2. ❌ **Scheduled Job** - periodic matching (ყოველ 30 წუთში)
3. ❌ **Match History** - შენახული matches tracking (optional)

### Frontend (React Native):
1. ❌ **Notification Handler** - როცა user tap-ს აკეთებს notification-ზე
2. ❌ **Navigation Logic** - გადასვლა სწორ screen-ზე (PartDetails, RequestDetails)
3. ❌ **Badge Management** - notification count badge

### Testing:
1. ❌ **Test Part Creation** - შექმენი part და ნახე მოდის თუ არა notification
2. ❌ **Test Request Creation** - შექმენი request და ნახე მოდის თუ არა notification
3. ❌ **Test Confidence Thresholds** - სხვადასხვა match scenarios

---

## 🔧 Configuration:

### Environment Variables (არ არის საჭირო ახალი):
```env
FCM_SERVER_KEY=your_fcm_server_key  # უკვე გაქვს
```

### Confidence Threshold (შეცვლა):
```typescript
// ai-notifications.service.ts - line 134, 204
if (confidence >= 0.6) { // შეცვალე 0.6 → 0.7 უფრო მკაცრი threshold-ისთვის
```

---

## ✅ Ready to Test!

1. **Start Backend:**
   ```bash
   cd backend-v2
   npm run start:dev
   ```

2. **Create a Part** (Postman/Frontend):
   ```json
   POST /parts
   {
     "name": "ძრავა",
     "vehicle": {
       "make": "BMW",
       "model": "X5",
       "year": "2020"
     },
     "price": 2500
   }
   ```

3. **Check Logs** - უნდა დაინახო:
   ```
   🤖 [AI-NOTIFY] Checking matching requests...
   ✅ [AI-NOTIFY] Sent notification to user...
   ```

4. **Check Phone** - უნდა მოვიდეს push notification! 📱

---

## 📝 Notes:

- **forwardRef** გამოიყენება circular dependency-ის თავიდან ასაცილებლად
- **Firebase Admin SDK** უკვე setup-ში არის
- **Confidence calculation** შეიძლება დაიტუნოს თქვენი საჭიროებების მიხედვით
- **Async execution** - AI matching არ აყოვნებს part/request creation-ს

---

გილოცავ! 🎉 AI-based Push Notifications მზადაა!
