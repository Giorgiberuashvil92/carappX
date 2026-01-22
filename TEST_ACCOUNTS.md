# Test Accounts - Marte App

## Test Credentials for Testers

### Test Account 1 (Main)
- **Phone Number**: `557-422-634` ან `557422634`
- **Password**: `1234`
- **Description**: ძირითადი test account

### როგორ შევიდნენ Testers-მა:

#### ნაბიჯები:
1. გახსენით **Marte** აპლიკაცია
2. შეიყვანეთ ტელეფონის ნომერი: **557-422-634** (ან **557422634**)
3. დააჭირეთ **"შესვლა"** ღილაკს
4. გამოჩნდება **Password** ველი
5. შეიყვანეთ password: **1234**
6. დააჭირეთ **"შესვლა"** ღილაკს
7. წარმატებით შეხვალთ აპლიკაციაში!

### სურათები/სკრინშოტები:

**Login Screen:**
```
┌─────────────────────────┐
│   Marte                 │
│                         │
│   [557-422-634]         │ ← შეიყვანეთ ეს ნომერი
│                         │
│   [Password: 1234]      │ ← შეიყვანეთ ეს password
│                         │
│   [შესვლა]              │
└─────────────────────────┘
```

### შენიშვნები:

- ეს არის **test account**, არ საჭიროებს SMS verification
- Password არის: **1234**
- შეგიძლიათ გამოიყენოთ რამდენჯერმე
- ყველა tester-ს შეუძლია გამოიყენოს ეს account

### რა შეგიძლიათ გააკეთოთ Test Account-ით:

✅ დაამატოთ მანქანები გარაჟში
✅ შექმნათ community posts
✅ გამოიყენოთ CarFAX (თუ premium subscription აქვთ)
✅ დაათვალიეროთ სერვისები
✅ გამოიყენოთ marketplace
✅ დაათვალიეროთ carwash locations

### Troubleshooting:

**თუ password ველი არ ჩანს:**
- დარწმუნდით რომ შეიყვანეთ სწორი ტელეფონის ნომერი: **557-422-634**
- ტელეფონის ნომერი უნდა იყოს ზუსტად: `557422634` (9 ციფრი)

**თუ password არ მუშაობს:**
- დარწმუნდით რომ შეიყვანეთ: **1234**
- დარწმუნდით რომ არ არის extra spaces

**თუ შესვლა ვერ მოხერხდა:**
- დარწმუნდით რომ აპლიკაცია განახლებულია
- სცადეთ აპლიკაციის restart

### Test Account-ის გამოყენების ინსტრუქცია (ინგლისურად):

```
How to Login as Tester:

1. Open the Marte app
2. Enter phone number: 557-422-634 (or 557422634)
3. Click "შესვლა" (Login) button
4. Password field will appear
5. Enter password: 1234
6. Click "შესვლა" (Login) button
7. You're in!

Note: This is a test account, no SMS verification needed.
```

### რამდენიმე Test Account-ის შექმნა (თუ გჭირდებათ):

თუ გსურთ რამდენიმე test account-ის შექმნა, შეგიძლიათ:

1. შექმნათ ახალი test phone numbers `LoginScreen.tsx`-ში
2. ან გამოიყენოთ რეალური ტელეფონის ნომრები OTP verification-ით

**მაგალითი რამდენიმე test account-ისთვის:**

```typescript
// LoginScreen.tsx-ში
const TEST_ACCOUNTS = {
  '557422634': { password: '1234', name: 'Test User 1' },
  '555123456': { password: 'test2', name: 'Test User 2' },
  '555789012': { password: 'test3', name: 'Test User 3' },
};
```

### Contact:

თუ პრობლემა გაქვთ შესვლაში, დაუკავშირდით development team-ს.





