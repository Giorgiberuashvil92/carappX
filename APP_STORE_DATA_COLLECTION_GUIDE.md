# 📱 App Store Data Collection Disclosure - Step by Step Guide

## 🍎 iOS App Store Connect

### 1. **App Store Connect-ში შესვლა**
- გადადი: https://appstoreconnect.apple.com
- შედი Apple ID-ით

### 2. **App Privacy-ს პოვნა**
1. აირჩიე **"My Apps"** (ან **"Apps"**)
2. აირჩიე შენი app (Marte)
3. მარცხენა მენიუში იპოვე **"App Privacy"** (ან **"Privacy"**)
4. დააჭირე **"Get Started"** (თუ პირველად ამატებ)

### 3. **Data Collection Types-ის დამატება**

#### **Step 1: Data Types**
დააჭირე **"Add Data Type"** და დაამატე:

#### **1. Analytics Data (Firebase Analytics)**
- **Data Type:** აირჩიე **"Product Interaction"** → **"Analytics"**
- **Purpose:** 
  - ✅ **App Functionality** (Analytics-ისთვის)
  - ✅ **Analytics** (მომხმარებლის ქცევის ანალიზი)
- **Collected Data:**
  - ✅ **Device ID** (Firebase Analytics იყენებს)
  - ✅ **Product Interaction** (events, screen views)
  - ✅ **Usage Data** (app usage patterns)
- **Linked to User:** ✅ **Yes** (თუ user ID-ს იყენებ)
- **Used for Tracking:** ✅ **Yes** (Firebase Analytics tracking-ისთვის)

#### **2. Location Data**
- **Data Type:** აირჩიე **"Location"**
- **Purpose:**
  - ✅ **App Functionality** (location-based services)
  - ✅ **Analytics** (location-based analytics)
- **Collected Data:**
  - ✅ **Coarse Location** (თუ იყენებ)
  - ✅ **Precise Location** (თუ იყენებ)
- **Linked to User:** ✅ **Yes**
- **Used for Tracking:** ❌ **No** (ან ✅ **Yes** თუ tracking-ში იყენებ)

#### **3. User Content**
- **Data Type:** აირჩიე **"User Content"**
- **Purpose:**
  - ✅ **App Functionality** (profile photos, user data)
- **Collected Data:**
  - ✅ **Photos or Videos** (profile photos)
  - ✅ **Other User Content** (user-generated content)
- **Linked to User:** ✅ **Yes**
- **Used for Tracking:** ❌ **No**

#### **4. Device ID**
- **Data Type:** აირჩიე **"Device ID"**
- **Purpose:**
  - ✅ **Analytics** (Firebase Analytics)
  - ✅ **App Functionality** (device identification)
- **Collected Data:**
  - ✅ **Device ID** (Firebase Analytics)
- **Linked to User:** ✅ **Yes**
- **Used for Tracking:** ✅ **Yes**

#### **5. Usage Data**
- **Data Type:** აირჩიე **"Product Interaction"** → **"Other Usage Data"**
- **Purpose:**
  - ✅ **Analytics** (app usage patterns)
- **Collected Data:**
  - ✅ **Other Usage Data** (screen views, events)
- **Linked to User:** ✅ **Yes**
- **Used for Tracking:** ✅ **Yes**

### 4. **Third-Party Data Sharing**

#### **Firebase Analytics (Google)**
- **Third Party:** ✅ **Yes**
- **Company:** **Google** (Firebase)
- **Purpose:** Analytics
- **Data Types:** Analytics Data, Device ID, Usage Data

### 5. **Privacy Policy URL**
- **Required:** ✅ დიახ
- **Where:** App Privacy → Privacy Policy URL
- **Format:** `https://yourdomain.com/privacy-policy`
- **Example:** `https://marte.ge/privacy-policy`

---

## 🤖 Google Play Console

### 1. **Google Play Console-ში შესვლა**
- გადადი: https://play.google.com/console
- შედი Google Account-ით

### 2. **Data Safety-ს პოვნა**
1. აირჩიე შენი app (Marte)
2. მარცხენა მენიუში იპოვე **"Policy"** → **"App content"**
3. იპოვე **"Data safety"** section
4. დააჭირე **"Start"** (თუ პირველად ამატებ)

### 3. **Data Collection Types-ის დამატება**

#### **Step 1: Data Collection**
დააჭირე **"Add data type"** და დაამატე:

#### **1. Analytics Data**
- **Data Type:** **Analytics**
- **Data Collected:**
  - ✅ **Device or other IDs** (Firebase Analytics)
  - ✅ **App activity** (screen views, events)
  - ✅ **App interactions** (user interactions)
- **Purpose:** 
  - ✅ **Analytics** (app analytics)
- **Shared with Third Parties:** ✅ **Yes** (Google Firebase)
- **Collected in App:** ✅ **Yes**

#### **2. Location Data**
- **Data Type:** **Location**
- **Data Collected:**
  - ✅ **Approximate location** (თუ იყენებ)
  - ✅ **Precise location** (თუ იყენებ)
- **Purpose:**
  - ✅ **App functionality** (location-based services)
  - ✅ **Analytics** (location analytics)
- **Shared with Third Parties:** ❌ **No** (ან ✅ **Yes** თუ Firebase-ში იგზავნება)
- **Collected in App:** ✅ **Yes**

#### **3. Photos and Videos**
- **Data Type:** **Photos and videos**
- **Data Collected:**
  - ✅ **Photos** (profile photos)
- **Purpose:**
  - ✅ **App functionality** (user profiles)
- **Shared with Third Parties:** ❌ **No**
- **Collected in App:** ✅ **Yes**

#### **4. Device or Other IDs**
- **Data Type:** **Device or other IDs**
- **Data Collected:**
  - ✅ **Device or other IDs** (Firebase Analytics)
- **Purpose:**
  - ✅ **Analytics** (Firebase Analytics)
- **Shared with Third Parties:** ✅ **Yes** (Google Firebase)
- **Collected in App:** ✅ **Yes**

### 4. **Data Sharing**

#### **Third-Party Services**
- **Google Firebase Analytics:**
  - **Purpose:** Analytics
  - **Data Types:** Analytics Data, Device ID
  - **Data Shared:** ✅ **Yes**

### 5. **Privacy Policy URL**
- **Required:** ✅ დიახ
- **Where:** App content → Privacy policy
- **Format:** `https://yourdomain.com/privacy-policy`
- **Example:** `https://marte.ge/privacy-policy`

---

## 📋 Quick Checklist

### iOS App Store Connect
- [ ] App Privacy → Data Types დამატებულია
- [ ] Analytics Data დეკლარირებულია
- [ ] Location Data დეკლარირებულია
- [ ] User Content დეკლარირებულია
- [ ] Device ID დეკლარირებულია
- [ ] Third-Party Sharing (Firebase) დეკლარირებულია
- [ ] Privacy Policy URL დამატებულია

### Google Play Console
- [ ] Data Safety → Data Collection დამატებულია
- [ ] Analytics Data დეკლარირებულია
- [ ] Location Data დეკლარირებულია
- [ ] Photos/Videos დეკლარირებულია
- [ ] Device ID დეკლარირებულია
- [ ] Third-Party Sharing (Firebase) დეკლარირებულია
- [ ] Privacy Policy URL დამატებულია

---

## 🔗 Direct Links

### iOS App Store Connect
- **App Privacy:** https://appstoreconnect.apple.com → My Apps → [Your App] → App Privacy

### Google Play Console
- **Data Safety:** https://play.google.com/console → [Your App] → Policy → App content → Data safety

---

## 💡 Tips

1. **Be Honest:** დეკლარირე მხოლოდ ის მონაცემები, რომლებსაც რეალურად აგროვებ
2. **Be Specific:** იყავი კონკრეტული - რა მონაცემები, რა მიზნით
3. **Update Regularly:** თუ ახალ მონაცემებს იწყებ აგროვებას, განაახლე disclosure
4. **Privacy Policy:** დარწმუნდი რომ Privacy Policy-ში ასევე არის ეს ინფორმაცია

---

## ⚠️ Important Notes

- **App Store Connect** - Data Collection Disclosure **სავალდებულოა** iOS 14.5+ apps-ისთვის
- **Google Play Console** - Data Safety Section **სავალდებულოა** 2022 წლიდან
- **Privacy Policy** - **სავალდებულოა** ორივე platform-ზე
- **Incorrect Disclosure** - შეიძლება app rejection-ის მიზეზი გახდეს


