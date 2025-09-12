# მანქანების დამატების მოდალი

ეს არის მოდალი მანქანების დამატებისთვის, რომელიც შექმნილია carwash.tsx-ის მსგავსი დიზაინის გამოყენებით.

## მახასიათებლები

- **ქართული ინტერფეისი** - ყველა ტექსტი ქართულად
- **მოდერნული დიზაინი** - carwash.tsx-ის მსგავსი სტილი
- **ფორმის ვალიდაცია** - სავალდებულო ველების შემოწმება
- **Picker მოდალები** - მარკების, ფერების, საწვავის ტიპებისა და გადაცემათა კოლოფის არჩევა
- **Responsive დიზაინი** - მობილური მოწყობილობებისთვის ოპტიმიზებული

## გამოყენება

### 1. კომპონენტის იმპორტი

```tsx
import AddCarModal from './components/garage/AddCarModal';
```

### 2. State-ის დამატება

```tsx
const [showAddCarModal, setShowAddCarModal] = useState(false);
const [cars, setCars] = useState<CarData[]>([]);
```

### 3. მოდალის გამოყენება

```tsx
<AddCarModal
  visible={showAddCarModal}
  onClose={() => setShowAddCarModal(false)}
  onAddCar={handleAddCar}
/>
```

### 4. მანქანის დამატების ფუნქცია

```tsx
const handleAddCar = (carData: CarData) => {
  setCars(prev => [...prev, carData]);
  console.log('დამატებული მანქანა:', carData);
};
```

## ინტერფეისი

### CarData ინტერფეისი

```tsx
interface CarData {
  id: string;
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  vin: string;
  fuelType: string;
  transmission: string;
}
```

### AddCarModalProps ინტერფეისი

```tsx
interface AddCarModalProps {
  visible: boolean;
  onClose: () => void;
  onAddCar: (carData: CarData) => void;
}
```

## ველები

### სავალდებულო ველები
- **მარკა** - მანქანის მარკა (picker-ით)
- **მოდელი** - მანქანის მოდელი (text input)
- **სახელმწიფო ნომერი** - ნომერი (text input, ავტომატურად დიდი ასოებით)

### არასავალდებულო ველები
- **წელი** - წარმოების წელი (numeric input)
- **ფერი** - მანქანის ფერი (picker-ით)
- **VIN ნომერი** - VIN კოდი (text input)
- **საწვავის ტიპი** - საწვავის ტიპი (picker-ით)
- **გადაცემათა კოლოფი** - გადაცემათა კოლოფის ტიპი (picker-ით)

## მაგალითი გამოყენების

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddCarModal from './components/garage/AddCarModal';

export default function MyGarageScreen() {
  const [showModal, setShowModal] = useState(false);
  const [cars, setCars] = useState([]);

  const handleAddCar = (carData) => {
    setCars(prev => [...prev, carData]);
    setShowModal(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={24} />
        <Text>მანქანის დამატება</Text>
      </TouchableOpacity>

      <AddCarModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAddCar={handleAddCar}
      />
    </View>
  );
}
```

## სტილები

მოდალი იყენებს carwash.tsx-ის მსგავს სტილებს:
- თეთრი ფონი
- ლურჯი აქცენტის ფერი (#3B82F6)
- მრგვალი კუთხეები
- ჩრდილები და elevation
- NotoSans ფონტები

## დამატებითი ინფორმაცია

- მოდალი ავტომატურად ქმნის უნიკალურ ID-ს თარიღის მიხედვით
- ფორმის ვალიდაცია ხდება რეალურ დროში
- ყველა picker მოდალი იხსნება ქვემოდან slide ანიმაციით
- მოდალი იყენებს SafeAreaView-ს iOS-ის notch-ისთვის
