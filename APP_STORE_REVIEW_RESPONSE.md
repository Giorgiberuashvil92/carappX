# App Store Review Response

## Submission Information
- **Submission ID:** 78eb4945-2971-403b-b636-97c867327c48
- **Version:** 1.0.0
- **Review Date:** November 26, 2025

---

## Guideline 2.1 - Information Needed (Demo Account)

### Issue
We were unable to sign in with the demo account credentials provided in App Store Connect.

### Solution
We have verified and ensured that the demo account functionality is working correctly. The demo account credentials are:

**Demo Account Credentials:**
- **Phone Number:** `557422634` (without country code prefix or dashes)
- **Password:** `1234`

### Instructions for App Review:
1. On the login screen, enter the phone number: `557422634`
   - The phone number input will automatically format it as: `557-422-634`
2. When you enter this specific phone number, a password field will automatically appear below the phone input
3. Enter the password: `1234`
4. Tap the "გაგრძელება" (Continue) button
5. You will be logged in automatically without OTP verification

### Technical Details:
- The app detects the test phone number (`557422634`) and shows the password field
- Password validation happens before any OTP request
- Test account login bypasses SMS verification and logs in directly with full app access

**Note:** The test account provides full access to all app features and functionality, including:
- Browse and search services
- Book appointments
- Access all app features
- View maps and locations
- All other app functionality

---

## Guideline 2.3.3 - Performance - Accurate Metadata (iPad Screenshots)

### Issue
The 13-inch iPad screenshots show an iPhone device frame instead of iPad.

### Solution
We have confirmed that the app fully supports iPad devices. The app configuration includes `supportsTablet: true` in the iOS configuration.

### Action Required from App Review Team:
Please upload new iPad screenshots that show the app running on actual iPad devices (not iPhone frames). The app is configured to support tablets and will display correctly on iPad.

### Technical Confirmation:
- `supportsTablet: true` is enabled in `app.json`
- The app has been tested and works correctly on iPad devices
- All features are fully functional on both iPhone and iPad

---

## Guideline 5.1.2 - Legal - Privacy - Data Use and Sharing (App Tracking Transparency)

### Issue
The app privacy information indicates the app collects data for tracking, but the app does not use App Tracking Transparency to request user permission.

### Solution
We have now implemented the **App Tracking Transparency (ATT) framework** in the app. The app now properly requests user permission before collecting any data used for tracking.

### Implementation Details:

#### 1. App Tracking Transparency Framework Added
- **Package:** `expo-tracking-transparency@5.2.4`
- **Plugin:** Added to `app.json` with configuration
- **Permission Description:** Added `NSUserTrackingUsageDescription` to Info.plist

#### 2. Permission Request Implementation
The app now requests tracking permission at app launch:
- **Location:** The permission request is triggered in `app/_layout.tsx` when the app initializes
- **Timing:** Request is made 500ms after app launch to ensure proper initialization
- **Platform:** iOS only (as required by Apple)
- **User Experience:** The system dialog appears automatically, explaining why tracking permission is needed

#### 3. Permission Description
The permission message displayed to users (in Georgian):
> "აპს სჭირდება tracking permission გამოცდილების გასაუმჯობესებლად და პერსონალიზებული კონტენტის მისაწოდებლად."
>
> Translation: "The app needs tracking permission to improve experience and provide personalized content."

#### 4. Code Implementation
```typescript
// Location: app/_layout.tsx
import * as TrackingTransparency from 'expo-tracking-transparency';

// Request is made on app launch
const requestTrackingPermission = async () => {
  if (Platform.OS === 'ios') {
    setTimeout(async () => {
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      if (status === 'granted') {
        console.log('✅ User granted tracking permission');
      } else {
        console.log('❌ User denied tracking permission');
      }
    }, 500);
  }
};
```

### Data Collection Clarification:
The data types mentioned in App Privacy Information are collected, but tracking occurs **only** after user grants permission through the ATT dialog. The app respects user choice:
- If user grants permission: Data can be used for cross-app/website tracking
- If user denies permission: Data is used only for app functionality (authentication, location services, push notifications, etc.)

### Data Usage:
- **Phone Number:** User authentication and account management
- **Name, Contact Info:** User profile and app functionality
- **Location:** Location-based services within the app
- **Device ID:** Push notifications and device management
- **Photos/Videos:** User-uploaded content within the app

---

## Summary of Changes

1. ✅ **Demo Account:** Verified and working correctly
   - Phone: `557422634`
   - Password: `1234`
   - Password field appears automatically when test number is entered

2. ✅ **iPad Support:** Confirmed and enabled
   - `supportsTablet: true` in app configuration
   - App works correctly on iPad devices
   - New iPad screenshots need to be uploaded in App Store Connect

3. ✅ **App Tracking Transparency:** Fully implemented
   - ATT framework added to project
   - Permission request implemented in code
   - `NSUserTrackingUsageDescription` added to Info.plist
   - Permission dialog appears on app launch (iOS)

---

## Testing Instructions for App Review

1. **Test Demo Account:**
   - Open the app
   - Enter phone: `557422634`
   - Enter password: `1234` (when field appears)
   - Tap "გაგრძელება"
   - Should login successfully

2. **Test ATT Permission:**
   - Fresh install of the app
   - On app launch, ATT permission dialog should appear
   - Test both "Allow" and "Ask App Not to Track" options
   - Verify app continues to function in both cases

3. **Verify iPad Support:**
   - Test on iPad device or simulator
   - All features should work correctly
   - UI should adapt to iPad screen size

---

## Additional Notes

- All features are fully functional with the provided demo account
- The app respects user privacy choices for tracking
- ATT permission request is implemented according to Apple guidelines
- The app provides full functionality regardless of tracking permission status

Thank you for your review. Please let us know if you need any additional information or clarification.
