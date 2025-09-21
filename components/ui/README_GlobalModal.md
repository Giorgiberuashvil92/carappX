# 🌟 გლობალური Modal სისტემა

ეს არის მოდულარული Modal სისტემა, რომელიც საშუალებას გაძლევთ მარტივად შექმნათ და მართოთ სხვადასხვა ტიპის Modal-ები მთელი აპლიკაციის მასშტაბით.

## 📁 ფაილების სტრუქტურა

```
components/ui/
├── GlobalModal.tsx      # მთავარი Modal კომპონენტი
├── ModalTypes.tsx       # Modal-ის კონტენტის კომპონენტები
└── README_GlobalModal.md # ეს დოკუმენტაცია

contexts/
└── ModalContext.tsx     # Modal-ის მართვის Context
```

## 🚀 გამოყენება

### 1. ModalProvider-ის დამატება

```tsx
// app/_layout.tsx
import { ModalProvider } from '../contexts/ModalContext';

export default function RootLayout() {
  return (
    <ModalProvider>
      {/* თქვენი აპლიკაცია */}
    </ModalProvider>
  );
}
```

### 2. useModal Hook-ის გამოყენება

```tsx
import { useModal } from '../contexts/ModalContext';

function MyComponent() {
  const { showModal, hideModal } = useModal();

  const handleShowModal = () => {
    showModal({
      type: 'custom',
      title: 'ჩემი Modal',
      content: <Text>კონტენტი</Text>,
      onClose: hideModal,
    });
  };

  return (
    <TouchableOpacity onPress={handleShowModal}>
      <Text>Modal-ის ჩვენება</Text>
    </TouchableOpacity>
  );
}
```

### 3. კონვენციური Hook-ების გამოყენება

```tsx
import { useCarModal, useReminderModal } from '../contexts/ModalContext';

function MyComponent() {
  const { showAddCarModal } = useCarModal();
  const { showAddReminderModal } = useReminderModal();

  return (
    <View>
      <TouchableOpacity onPress={() => showAddCarModal(handleAddCar)}>
        <Text>მანქანის დამატება</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => showAddReminderModal(handleAddReminder)}>
        <Text>შეხსენების დამატება</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## 🎨 Modal-ის კონფიგურაცია

### ModalConfig ტიპი

```tsx
type ModalConfig = {
  type: ModalType;                    // Modal-ის ტიპი
  title: string;                      // სათაური
  subtitle?: string;                  // ქვესათაური (არჩევითი)
  icon?: string;                      // აიკონი (Ionicons)
  content: React.ReactNode;           // კონტენტი
  footer?: React.ReactNode;           // ფუტერი (არჩევითი)
  onClose: () => void;                // დახურვის ფუნქცია
  showCloseButton?: boolean;          // დახურვის ღილაკის ჩვენება
  closeOnOverlay?: boolean;           // overlay-ზე დაწკაპუნებაზე დახურვა
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  height?: number;                    // Modal-ის სიმაღლე (0-1)
  backgroundColor?: string;           // ფონის ფერი
  headerGradient?: string[];          // გრადიენტი ჰედერისთვის
  transparent?: boolean;              // გამჭვირვალობა
};
```

### Modal-ის ტიპები

```tsx
type ModalType = 
  | 'add-car'           // მანქანის დამატება
  | 'add-reminder'      // შეხსენების დამატება
  | 'car-detail'        // მანქანის დეტალები
  | 'add-item'          // ნივთის დამატება
  | 'detail-item'       // ნივთის დეტალები
  | 'booking-details'   // ჯავშნის დეტალები
  | 'cancel-booking'    // ჯავშნის გაუქმება
  | 'rebook'           // ხელახალი ჯავშანი
  | 'filter'           // ფილტრები
  | 'custom';          // მორგებული
```

## 🎯 მაგალითები

### მარტივი Modal

```tsx
showModal({
  type: 'custom',
  title: 'შეტყობინება',
  content: <Text>ეს არის მარტივი Modal!</Text>,
  onClose: hideModal,
});
```

### გრადიენტიანი Modal

```tsx
showModal({
  type: 'add-reminder',
  title: 'ახალი შეხსენება',
  subtitle: 'შეიყვანეთ ინფორმაცია',
  icon: 'alarm-outline',
  headerGradient: ['#667eea', '#764ba2'],
  content: <AddReminderForm />,
  footer: <StandardFooter onCancel={hideModal} onConfirm={handleConfirm} />,
  onClose: hideModal,
});
```

### სრული ეკრანის Modal

```tsx
showModal({
  type: 'filter',
  title: 'ფილტრები',
  height: 1.0,
  presentationStyle: 'fullScreen',
  content: <FilterForm />,
  onClose: hideModal,
});
```

## 🔧 კონტენტის კომპონენტები

### ModalTypes.tsx-ში არის:

- `AddCarModalContent` - მანქანის დამატების ფორმა
- `AddReminderModalContent` - შეხსენების დამატების ფორმა
- `DetailModalContent` - დეტალური ინფორმაცია
- `FilterModalContent` - ფილტრების ფორმა
- `StandardFooter` - სტანდარტული ფუტერი
- `ThreeButtonFooter` - სამი ღილაკიანი ფუტერი

## 🎨 სტილიზაცია

Modal-ები ავტომატურად იყენებენ:
- **Inter ფონტს** - 500 weight
- **ნაზ ფერებს** - ნაცარი, ლურჯი, თეთრი
- **ღრუ ფარდებს** - ყველგან კონსისტენტული
- **ანიმაციებს** - სუფთა გადასვლები
- **შეფუძვნულ დიზაინს** - თანამედროვე UI

## 📱 რესპონსივობა

- **iOS/Android** - ორივე პლატფორმისთვის ოპტიმიზებული
- **Safe Area** - ყველა ეკრანზე კარგად ჩანს
- **Keyboard** - კლავიატურის ამოვარდნისას ავტომატურად ირგება
- **ScrollView** - ყველა კონტენტისთვის

## 🔄 მიგრაცია

არსებული Modal-ებიდან ახალ სისტემაზე გადასვლა:

1. **ძველი Modal კომპონენტი** → **ModalTypes.tsx-ში ახალი კონტენტი**
2. **useState(showModal)** → **useModal() hook**
3. **Modal JSX** → **showModal() ფუნქცია**

## 🎉 უპირატესობები

✅ **მოდულარულობა** - ერთი კომპონენტი ყველა Modal-ისთვის
✅ **კონსისტენტობა** - ერთიანი დიზაინი მთელი აპში
✅ **მარტივობა** - მარტივი API და გამოყენება
✅ **ფლექსიბილობა** - ნებისმიერი კონტენტისთვის
✅ **ანიმაციები** - ლამაზი გადასვლები
✅ **ტიპიზაცია** - TypeScript მხარდაჭერა
✅ **პროდუქტიულობა** - სწრაფი დეველოპმენტი

---

**მშვენიერი კოდირება! 🚀**
