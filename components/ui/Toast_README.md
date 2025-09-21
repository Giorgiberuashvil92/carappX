# Toast კომპონენტი

ლამაზი ანიმირებული Toast კომპონენტი CarappX-ისთვის.

## მახასიათებლები

- 🎨 **4 ტიპი**: success, error, warning, info
- ✨ **ანიმაციები**: შემოსვლა, გაქრობა, scale ეფექტები
- 🎯 **მარტივი გამოყენება**: Context API-ით
- 📱 **რესპონსივი**: ყველა ეკრანის ზომაზე
- 🎨 **ლამაზი დიზაინი**: ღია UI თემა
- 🇬🇪 **ქართული ენა**: ყველა ტექსტი ქართულად

## გამოყენება

### 1. Context-ის იმპორტი

```tsx
import { useToast } from '../../contexts/ToastContext';
```

### 2. Toast-ების ჩვენება

```tsx
const { success, error, warning, info } = useToast();

// წარმატება
success('წარმატება!', 'ოპერაცია დასრულდა');

// შეცდომა
error('შეცდომა!', 'რაღაც შეცდომა მოხდა');

// გაფრთხილება
warning('გაფრთხილება!', 'ყურადღებით წაიკითხოთ');

// ინფორმაცია
info('ინფორმაცია', 'სასარგებლო ინფორმაცია');
```

### 3. მოწინავე გამოყენება

```tsx
const { showToast, hideToast, hideAllToasts } = useToast();

// კონკრეტული Toast-ის ჩვენება
showToast({
  type: 'success',
  title: 'წარმატება!',
  message: 'ოპერაცია დასრულდა',
  duration: 5000,
  position: 'top'
});

// Toast-ის დამალვა
hideToast('toast-id');

// ყველა Toast-ის დამალვა
hideAllToasts();
```

## პარამეტრები

### ToastType
- `success` - წარმატებული ოპერაცია
- `error` - შეცდომა
- `warning` - გაფრთხილება
- `info` - ინფორმაცია

### ToastProps
- `id: string` - უნიკალური ID
- `type: ToastType` - Toast-ის ტიპი
- `title: string` - მთავარი ტექსტი
- `message?: string` - დამატებითი ტექსტი
- `duration?: number` - ჩვენების დრო (მილიწამებში)
- `position?: 'top' | 'bottom'` - პოზიცია ეკრანზე

## ანიმაციები

- **შემოსვლა**: translateY, opacity, scale
- **გაქრობა**: translateY, opacity, scale
- **Spring ანიმაცია**: scale ეფექტისთვის
- **Timing ანიმაცია**: translateY და opacity-ისთვის

## სტილები

- **Success**: მწვანე ფერები
- **Error**: წითელი ფერები  
- **Warning**: ყვითელი ფერები
- **Info**: ლურჯი ფერები

## მაგალითი

```tsx
import React from 'react';
import { View } from 'react-native';
import Button from './Button';
import { useToast } from '../../contexts/ToastContext';

const MyComponent = () => {
  const { success, error } = useToast();

  const handleSuccess = () => {
    success('წარმატება!', 'ოპერაცია დასრულდა');
  };

  const handleError = () => {
    error('შეცდომა!', 'რაღაც შეცდომა მოხდა');
  };

  return (
    <View>
      <Button title="წარმატება" onPress={handleSuccess} />
      <Button title="შეცდომა" onPress={handleError} />
    </View>
  );
};
```

## ტექნიკური დეტალები

- **React Native Animated API** - ანიმაციებისთვის
- **Context API** - state მართვისთვის
- **TypeScript** - ტიპების უსაფრთხოებისთვის
- **Expo Vector Icons** - იკონებისთვის
- **Poppins Font** - ტექსტის სტილისთვის
