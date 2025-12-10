# 🚂 Rails API Endpoint Requirements - Authentication Flow

## 📋 პრობლემა

როცა მომხმარებელი ტელეფონის ნომერს შეიყვანს რეგისტრაციის დროს, frontend არ იცის რომ ეს არ დარეგისტრირებული ნომერია და არ გადაყავს რეგისტრაციის ფორმაზე.

## ✅ გამოსწორება

Rails API-ს უნდა აბრუნებდეს `intent` ველს რომ frontend-მა გაიგოს არის თუ არა ნომერი დარეგისტრირებული.

---

## 🔐 Authentication Endpoints

### 1. `POST /auth/start`

**Request:**
```json
{
  "phone": "599123456"
}
```

**Response (ნომერი დარეგისტრირებულია):**
```json
{
  "id": "otp_verification_id_123",
  "intent": "login",
  "code": "1234"  // optional - development/testing-ისთვის
}
```

**Response (ნომერი არ არის დარეგისტრირებული):**
```json
{
  "id": "otp_verification_id_123",
  "intent": "register",  // ⚠️ ეს არის მნიშვნელოვანი!
  "code": "1234"  // optional - development/testing-ისთვის
}
```

**შენიშვნა:** `intent` ველი **სავალდებულოა** და უნდა იყოს `"login"` ან `"register"`:
- `"login"` - როცა ნომერი უკვე დარეგისტრირებულია
- `"register"` - როცა ნომერი არ არის დარეგისტრირებული

---

### 2. `POST /auth/verify`

**Request:**
```json
{
  "otpId": "otp_verification_id_123",
  "code": "1234"
}
```

**Response (ნომერი დარეგისტრირებულია - Login):**
```json
{
  "user": {
    "id": "user_123",
    "phone": "599123456",
    "firstName": "გიორგი",
    "role": "user",
    // ... სხვა user ველები
  },
  "intent": "login",  // optional, მაგრამ რეკომენდებულია
  "subscription": {  // optional
    // subscription data
  }
}
```

**Response (ნომერი არ არის დარეგისტრირებული - Registration):**
```json
{
  "user": {
    "id": "user_123",  // ⚠️ ახალი user უნდა შეიქმნას OTP verification-ის დროს
    "phone": "599123456",
    "firstName": null,  // null რადგან ჯერ არ არის შევსებული
    "role": null,  // null რადგან ჯერ არ არის არჩეული
    // ... სხვა user ველები
  },
  "intent": "register"  // ⚠️ ეს არის მნიშვნელოვანი!
}
```

**შენიშვნა:** 
- როცა `intent` არის `"register"`, frontend გადაყავს რეგისტრაციის ფორმაზე
- `user.id` უნდა იყოს შექმნილი OTP verification-ის შემდეგ, რათა `/auth/complete` endpoint-ში გამოვიყენოთ

---

### 3. `POST /auth/complete`

**Request:**
```json
{
  "userId": "user_123",
  "firstName": "გიორგი",
  "role": "user"  // ან "partner"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "phone": "599123456",
    "firstName": "გიორგი",
    "role": "user",
    // ... სრული user object
  }
}
```

---

## 🔍 Rails Controller Example

```ruby
class AuthController < ApplicationController
  def start
    phone = params[:phone]
    
    # შეამოწმეთ არის თუ არა ნომერი დარეგისტრირებული
    user = User.find_by(phone: phone)
    intent = user ? 'login' : 'register'
    
    # OTP-ის გაგზავნა
    otp_code = generate_otp
    otp_id = create_otp_record(phone, otp_code)
    
    # SMS-ის გაგზავნა (production-ში)
    # send_sms(phone, otp_code) unless Rails.env.development?
    
    render json: {
      id: otp_id,
      intent: intent,  # ⚠️ ეს არის მნიშვნელოვანი!
      code: Rails.env.development? ? otp_code : nil  # development-ში ჩვენ დავბრუნოთ
    }
  end
  
  def verify
    otp_id = params[:otpId]
    code = params[:code]
    
    # OTP-ის შემოწმება
    otp_record = OtpVerification.find(otp_id)
    unless otp_record.code == code && !otp_record.expired?
      return render json: { message: 'Invalid or expired code' }, status: :unprocessable_entity
    end
    
    phone = otp_record.phone
    user = User.find_by(phone: phone)
    
    if user
      # ნომერი დარეგისტრირებულია - login
      render json: {
        user: user.as_json,
        intent: 'login'
      }
    else
      # ნომერი არ არის დარეგისტრირებული - register
      # შევქმნათ ახალი user incomplete მონაცემებით
      new_user = User.create!(
        phone: phone,
        firstName: nil,
        role: nil,
        # სხვა default ველები
      )
      
      render json: {
        user: new_user.as_json,
        intent: 'register'  # ⚠️ ეს არის მნიშვნელოვანი!
      }
    end
  end
  
  def complete
    user = User.find(params[:userId])
    user.update!(
      firstName: params[:firstName],
      role: params[:role]
    )
    
    render json: {
      user: user.reload.as_json
    }
  end
end
```

---

## ✅ Checklist

- [ ] `/auth/start` endpoint-ი აბრუნებს `intent: 'register'` როცა ნომერი არ არის დარეგისტრირებული
- [ ] `/auth/start` endpoint-ი აბრუნებს `intent: 'login'` როცა ნომერი დარეგისტრირებულია
- [ ] `/auth/verify` endpoint-ი აბრუნებს `intent: 'register'` როცა ნომერი არ არის დარეგისტრირებული
- [ ] `/auth/verify` endpoint-ი აბრუნებს `user.id` როცა `intent` არის `'register'` (ახალი user შექმნილი უნდა იყოს)
- [ ] Frontend-ში console.log-ებში ჩანს `intent` ველის მნიშვნელობა

---

## 🐛 Debug

Frontend-ში დამატებულია console.log-ები რომ შევამოწმოთ რას აბრუნებს API:

1. `handleStartOtp`-ში: `console.log('📞 OTP Start Response:', { id, intent, hasCode })`
2. `verifyOTP`-ში: `console.log('🔍 OTP Verification Result:', { hasUser, dataIntent, pendingIntent, isRegisterIntent })`

Terminal-ში უნდა ჩანდეს ეს ლოგები როცა ტესტირებას აკეთებთ.


