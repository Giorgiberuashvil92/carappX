# iPad Screenshots Guide - App Store Connect

## პრობლემა
Apple App Review გვთხოვს 13-inch iPad screenshots-ების ატვირთვას, რომლებიც აჩვენებენ აპლიკაციას iPad device frame-ში (არა iPhone frame-ში).

## გადაწყვეტა

### ვარიანტი 1: iPad Simulator-ის გამოყენება (რეკომენდირებული)

#### 1. გახსენით Xcode-ი და iPad Simulator
```bash
# Xcode-ში გახსენით
open ios/Marte.xcworkspace

# ან პირდაპირ Simulator-ის გახსნა
open -a Simulator
```

#### 2. აირჩიეთ 13-inch iPad Pro Simulator
Xcode Simulator-ში:
- **Hardware > Device > iPad > iPad Pro (12.9-inch) (6th generation)**
- ან **iPad Pro (12.9-inch) (5th generation)** - iOS 15.1+ (თქვენი deployment target)

#### 3. გაუშვით აპლიკაცია
```bash
# Terminal-ში
npx expo run:ios --device "iPad Pro (12.9-inch) (6th generation)"
```

#### 4. გააკეთეთ Screenshots

**iOS Simulator-ში:**
- `Cmd + S` - Save Screenshot
- Screenshots ინახება Desktop-ზე PNG ფორმატში
- ან `File > New Screen Recording/Screenshot`

**ან manual:**
1. გაახსენით app iPad Simulator-ზე
2. გადადით სასურველ სკრინზე
3. `Cmd + S` (Simulator window active-ზე)
4. Screenshot დაემატება Desktop-ზე

#### 5. Screenshot-ების სწორი ზომები
- **13-inch iPad (iPad Pro 12.9-inch):**
  - Portrait: **2048 x 2732 pixels**
  - Landscape: **2732 x 2048 pixels**

### ვარიანტი 2: ფიზიკური iPad Device

თუ გაქვთ ფიზიკური iPad:
1. Build-ი გადაიტანეთ iPad-ზე (TestFlight ან Development Build)
2. გახსენით app iPad-ზე
3. გააკეთეთ screenshots:
   - `Power Button + Volume Up` (iPad-ებზე)
   - Screenshots ინახება Photos app-ში

### ვარიანტი 3: Screenshot Generation Tools

#### fastlane snapshot (რეკომენდირებული automation-ისთვის)
```bash
# დააინსტალირეთ fastlane
gem install fastlane

# დააინსტალირეთ snapshot
fastlane add_plugin snapshot

# Screenshots-ების გენერაცია
fastlane snapshot
```

## App Store Connect-ში ატვირთვა

### 1. შედით App Store Connect-ში
- https://appstoreconnect.apple.com
- გადადით თქვენი app-ის გვერდზე

### 2. გადადით Versions გვერდზე
- App Information > App Store > [Your Version] > App Preview and Screenshots

### 3. აირჩიეთ 13-inch iPad (6th generation)
- "iPad Pro (12.9-inch) (6th generation)" section
- ან "12.9" iPad Pro" - ეს არის 13-inch iPad

### 4. ატვირთეთ Screenshots
- **Portrait orientation:** ატვირთეთ 2048 x 2732 pixels PNG files
- **Landscape orientation:** ატვირთეთ 2732 x 2048 pixels PNG files

**მინიმალური მოთხოვნები:**
- მინიმუმ 1 screenshot აუცილებელია
- რეკომენდებული: 3-6 screenshots (მთავარი features-ის ჩვენება)

### 5. Screenshot Requirements
✅ **რა უნდა იყოს:**
- iPad device frame (არა iPhone frame)
- App UI iPad-ისთვის optimized
- Portrait ან Landscape orientation
- 2048 x 2732 (Portrait) ან 2732 x 2048 (Landscape) pixels

❌ **რა არ უნდა იყოს:**
- iPhone device frames
- Web previews
- Marketing materials (პრომო ბანერები)
- Splash screens ან login screens (უმეტეს შემთხვევაში)

## რეკომენდებული Screenshots

### Main Screen (Home)
1. **Home Screen** - პოპულარული სერვისები, stories, quick actions
   - აჩვენებს main features
   - iPad-ისთვის centered layout

2. **Services List/Search**
   - Browse services screen
   - Map view (თუ აქვს)

3. **Service Details**
   - Service detail page
   - Booking interface

4. **Profile/Settings**
   - User profile
   - Settings screen

5. **Key Features**
   - Car wash booking
   - Loyalty program
   - Marketplace (თუ აქვს)

## Script iPad Screenshots-ების გენერაციისთვის

### Xcode-ის გამოყენებით (Manual)

1. გახსენით iOS Simulator
2. აირჩიეთ iPad Pro 12.9-inch
3. Build and Run app
4. გადადით თითოეულ სკრინზე და `Cmd + S`
5. Screenshots Desktop-ზე ინახება

### Automate with Script

შევქმნათ script რომელიც გააკეთებს screenshots-ებს:

```bash
#!/bin/bash
# generate-ipad-screenshots.sh

echo "📱 iPad Screenshots Generation Script"
echo "======================================"

# Check if Simulator is running
if ! xcrun simctl list devices | grep -q "iPad Pro (12.9-inch)"; then
    echo "❌ iPad Pro 12.9-inch simulator not found"
    echo "Please open Simulator and select iPad Pro (12.9-inch)"
    exit 1
fi

# Create screenshots directory
mkdir -p screenshots/ipad-pro-13inch
cd screenshots/ipad-pro-13inch

echo "✅ Screenshots will be saved to: $(pwd)"
echo ""
echo "Instructions:"
echo "1. Make sure your app is running on iPad Pro 12.9-inch simulator"
echo "2. Navigate to each screen you want to screenshot"
echo "3. Press Cmd + S in Simulator window to save screenshot"
echo "4. Screenshots will be saved to Desktop"
echo "5. Move screenshots to: $(pwd)"
echo ""
echo "Screenshot Requirements:"
echo "- Size: 2048 x 2732 pixels (Portrait)"
echo "- Format: PNG"
echo "- Device: iPad Pro 12.9-inch frame"
echo ""
echo "After taking screenshots, rename them:"
echo "  - 01-home.png"
echo "  - 02-services.png"
echo "  - 03-details.png"
echo "  - 04-profile.png"
echo "  - etc."
```

## Quick Steps Summary

1. ✅ **Open iPad Simulator:**
   ```bash
   open -a Simulator
   Hardware > Device > iPad > iPad Pro (12.9-inch)
   ```

2. ✅ **Run App:**
   ```bash
   npx expo run:ios --device "iPad Pro (12.9-inch)"
   ```

3. ✅ **Take Screenshots:**
   - Navigate to each screen
   - Press `Cmd + S` in Simulator
   - Screenshots save to Desktop

4. ✅ **Verify Screenshots:**
   - Check size: 2048 x 2732 (Portrait) ან 2732 x 2048 (Landscape)
   - Verify iPad device frame (not iPhone)
   - Check that UI looks good on iPad

5. ✅ **Upload to App Store Connect:**
   - App Store Connect > Your App > Version > Screenshots
   - Select "iPad Pro (12.9-inch)"
   - Upload PNG files

## Troubleshooting

### Problem: Screenshots show iPhone frame
**Solution:** Make sure you're using iPad Pro 12.9-inch simulator, not iPhone simulator

### Problem: Wrong screenshot size
**Solution:** Use `Cmd + S` in Simulator (not screenshot tools). Simulator automatically saves correct size.

### Problem: UI doesn't look good on iPad
**Solution:** 
- Check that responsive design is implemented (we've done this)
- Test app on iPad simulator
- Adjust layouts if needed

### Problem: Can't find iPad Pro in Simulator
**Solution:**
```bash
# Download iPad simulator in Xcode
Xcode > Settings > Components > Download iPad Pro (12.9-inch) Simulator
```

## Notes

- ⚠️ **Important:** Screenshots MUST show iPad device frame, not iPhone
- ✅ App already has `supportsTablet: true` in app.json
- ✅ Responsive design is implemented for iPad
- 📱 Test app on iPad simulator before taking screenshots
- 🎨 Make sure UI looks good and is centered on iPad

## Contact

თუ პრობლემა გაგიჩნდათ, შეგიძლიათ:
1. Check Apple's documentation: https://help.apple.com/app-store-connect/
2. Contact Apple Developer Support
3. Review App Store Connect screenshot requirements

---

**Last Updated:** $(date)
**App Version:** 1.0.0
