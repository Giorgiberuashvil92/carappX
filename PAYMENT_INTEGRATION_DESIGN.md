# 💳 აგრეგატორის ინტეგრაციის დიზაინი

## 🎯 მიზანი
ონლაინ გადახდების API-ს ინტეგრაცია carappX პროექტში აგრეგატორის პროტოკოლის მიხედვით.

## 📋 მიმდინარე სისტემის ანალიზი

### Frontend (React Native)
- ✅ `app/payment.tsx` - ძირითადი გადახდის გვერდი
- ✅ `app/payment-card.tsx` - ბარათის მართვის გვერდი  
- ✅ `services/paymentApi.ts` - API კომუნიკაცია
- ✅ BOG, Google Pay, Apple Pay მხარდაჭერა

### Backend (NestJS)
- ✅ `PaymentsService` - ბარათების შენახვა
- ✅ `PaymentsModule` - გადახდების მოდული
- ⚠️ BOG კონფიგურაცია მზადაა, მაგრამ რეალური ინტეგრაცია არ არის

## 🔧 აგრეგატორის პროტოკოლის მოთხოვნები

### 1. ტექნიკური სპეციფიკაციები
- **API არქიტექტურა**: RESTful
- **კომუნიკაცია**: HTTP/1.1 + HTTPS
- **მონაცემთა ფორმატი**: JSON
- **ავთენტიფიკაცია**: OAuth 2.0 + JWT
- **Webhook**: ასინქრონული callback-ები

### 2. გადახდის პროცესი
```
1. მომხმარებელი აინიცირებს გადახდას
2. ბიზნესი აგზავნის შეკვეთის მოთხოვნას API-ში
3. API აბრუნებს შეკვეთის დეტალებს (ID + redirect URL)
4. მომხმარებელი გადამისამართდება გადახდის გვერდზე
5. გადახდის დამუშავება
6. Callback შეტყობინება ბიზნესთან
7. ოპერაციის დასრულება
```

## 🏗️ ინტეგრაციის დიზაინი

### Backend ცვლილებები

#### 1. ახალი Payment Gateway Service
```typescript
// src/payments/payment-gateway.service.ts
@Injectable()
export class PaymentGatewayService {
  // აგრეგატორის API-სთან კომუნიკაცია
  async createPaymentRequest(data: CreatePaymentRequestDto)
  async processCallback(callbackData: PaymentCallbackDto)
  async getPaymentStatus(orderId: string)
  async refundPayment(transactionId: string)
}
```

#### 2. განახლებული Payments Controller
```typescript
// src/payments/payments.controller.ts
@Controller('payments')
export class PaymentsController {
  @Post('create-order')
  async createOrder(@Body() data: CreateOrderDto)
  
  @Post('callback')
  async handleCallback(@Body() data: PaymentCallbackDto)
  
  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string)
}
```

#### 3. ახალი DTOs
```typescript
// src/payments/dto/create-order.dto.ts
export class CreateOrderDto {
  amount: number;
  currency: string;
  description: string;
  customerInfo: CustomerInfoDto;
  callbackUrl: string;
  returnUrl: string;
}

// src/payments/dto/payment-callback.dto.ts
export class PaymentCallbackDto {
  orderId: string;
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  signature: string;
}
```

### Frontend ცვლილებები

#### 1. განახლებული Payment API Service
```typescript
// services/paymentGatewayApi.ts
export const paymentGatewayApi = {
  async createPaymentOrder(orderData: CreateOrderData)
  async checkPaymentStatus(orderId: string)
  async handlePaymentRedirect(paymentUrl: string)
}
```

#### 2. განახლებული Payment Screen
- აგრეგატორის გადახდის ვარიანტის დამატება
- გადამისამართების ლოგიკა
- Callback-ის დამუშავება

## 🔐 უსაფრთხოება

### 1. Environment Variables
```env
PAYMENT_GATEWAY_API_URL=https://api.payment-gateway.com
PAYMENT_GATEWAY_MERCHANT_ID=your_merchant_id
PAYMENT_GATEWAY_SECRET_KEY=your_secret_key
PAYMENT_GATEWAY_CALLBACK_URL=https://your-domain.com/payments/callback
```

### 2. Signature Validation
- ყველა callback-ის ვალიდაცია signature-ით
- JWT token-ების ვალიდაცია
- HTTPS-ის სავალდებულო გამოყენება

## 📊 მონიტორინგი

### 1. Logging
- API request/response logs
- Callback processing logs
- Error tracking

### 2. Analytics
- გადახდების წარმატების მაჩვენებელი
- Response times
- Error rates

## 🚀 იმპლემენტაციის ნაბიჯები

### Phase 1: Backend Infrastructure
1. Payment Gateway Service შექმნა
2. DTOs და Schemas დამატება
3. Controller endpoints იმპლემენტაცია
4. Webhook handler დამატება

### Phase 2: Frontend Integration
1. Payment Gateway API service
2. UI კომპონენტების განახლება
3. გადამისამართების ლოგიკა
4. Error handling

### Phase 3: Testing & Deployment
1. Unit tests
2. Integration tests
3. End-to-end testing
4. Production deployment

## 📝 API Endpoints

### Backend Endpoints
```
POST /payments/create-order - შეკვეთის შექმნა
POST /payments/callback - Webhook callback
GET /payments/status/:orderId - გადახდის სტატუსი
POST /payments/refund - თანხის დაბრუნება
```

### Frontend API Calls
```typescript
paymentGatewayApi.createPaymentOrder()
paymentGatewayApi.checkPaymentStatus()
paymentGatewayApi.handlePaymentRedirect()
```

## 🔄 გადახდის Flow

1. **Order Creation**: Frontend → Backend → Payment Gateway
2. **User Redirect**: Frontend → Payment Gateway UI
3. **Payment Processing**: Payment Gateway
4. **Callback**: Payment Gateway → Backend
5. **Status Update**: Backend → Frontend (WebSocket/API)
6. **Completion**: Frontend UI update

## 📈 მომავალი გაუმჯობესებები

- [ ] ბარათის დამახსოვრების ფუნქციონალი
- [ ] გადახდების ისტორიის გვერდი
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Multi-currency support
- [ ] Subscription payments
