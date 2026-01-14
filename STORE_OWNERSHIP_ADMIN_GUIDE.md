# 🏪 მაღაზიის პატრონობის მინიჭების გზამკვლევი (Admin Panel)

## 📋 რა უნდა გაკეთდეს

დეველოპერმა უნდა შექმნას admin panel-ში ფუნქციონალი, რომელიც საშუალებას მისცემს ადმინს იუზერს მაღაზიის ID მიანიჭოს და ის ავტომატურად გახდება მაღაზიის პატრონი.

## 🔧 Backend API (უკვე მზადაა ✅)

Backend-ში უკვე არის მზად endpoint:

### Endpoint:
```
PUT /auth/update-owned-stores
```

### Request Body:
```json
{
  "userId": "usr_1234567890",
  "storeId": "store_id_here",
  "action": "add" // ან "remove"
}
```

### Response:
```json
{
  "success": true,
  "message": "Store added successfully",
  "user": {
    "id": "usr_1234567890",
    "ownedStores": ["store_id_here"]
  }
}
```

## 🎨 Frontend Implementation (რა უნდა გაკეთდეს)

### 1. Stores List Page-ში დამატება

**ფაილი**: `free-nextjs-admin-dashboard/src/app/(admin)/stores/page.tsx` (ან მსგავსი)

დაამატე "Assign Owner" ღილაკი თითოეული store-ისთვის:

```tsx
// Example structure
<Table>
  <TableBody>
    {stores.map((store) => (
      <TableRow key={store.id}>
        <TableCell>{store.name}</TableCell>
        <TableCell>{store.location}</TableCell>
        <TableCell>{store.ownerId || 'No Owner'}</TableCell>
        <TableCell>
          <Button onClick={() => openAssignOwnerModal(store)}>
            Assign Owner
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 2. Assign Owner Modal-ის შექმნა

**ფაილი**: `free-nextjs-admin-dashboard/src/components/AssignStoreOwnerModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AssignStoreOwnerModalProps {
  open: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    ownerId?: string;
  };
  onSuccess?: () => void;
}

export function AssignStoreOwnerModal({
  open,
  onClose,
  store,
  onSuccess,
}: AssignStoreOwnerModalProps) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!userId.trim()) {
      toast({
        title: 'შეცდომა',
        description: 'გთხოვთ შეიყვანოთ იუზერის ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-owned-stores`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId.trim(),
          storeId: store.id,
          action: 'add',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign store');
      }

      const result = await response.json();
      
      toast({
        title: 'წარმატება',
        description: `მაღაზია "${store.name}" წარმატებით მიენიჭა იუზერს`,
      });

      onSuccess?.();
      onClose();
      setUserId('');
    } catch (error: any) {
      toast({
        title: 'შეცდომა',
        description: error.message || 'მაღაზიის მინიჭებისას მოხდა შეცდომა',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!store.ownerId) {
      toast({
        title: 'შეცდომა',
        description: 'ამ მაღაზიას არ აქვს პატრონი',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-owned-stores`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: store.ownerId,
          storeId: store.id,
          action: 'remove',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove store');
      }

      toast({
        title: 'წარმატება',
        description: `მაღაზია "${store.name}" წარმატებით წაიშალა იუზერისგან`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'შეცდომა',
        description: error.message || 'მაღაზიის წაშლისას მოხდა შეცდომა',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>მაღაზიის პატრონის მინიჭება</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>მაღაზია</Label>
            <p className="text-sm text-muted-foreground">{store.name}</p>
          </div>

          {store.ownerId && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>მიმდინარე პატრონი:</strong> {store.ownerId}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="userId">იუზერის ID *</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="usr_1234567890"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              შეიყვანეთ იუზერის ID, რომელსაც გსურთ მაღაზიის პატრონად გახდით
            </p>
          </div>
        </div>

        <DialogFooter>
          {store.ownerId && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={loading}
            >
              პატრონობის მოხსნა
            </Button>
          )}
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? 'მიმდინარეობს...' : 'მინიჭება'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Store Edit Page-ში დამატება

**ფაილი**: `free-nextjs-admin-dashboard/src/app/(admin)/stores/[id]/page.tsx`

დაამატე სექცია store-ის რედაქტირების გვერდზე:

```tsx
// Store Edit Page-ში
<div className="space-y-4">
  <div>
    <Label>მიმდინარე პატრონი</Label>
    <p className="text-sm">{store.ownerId || 'პატრონი არ არის მინიჭებული'}</p>
  </div>
  
  <Button onClick={() => openAssignOwnerModal(store)}>
    {store.ownerId ? 'პატრონის შეცვლა' : 'პატრონის მინიჭება'}
  </Button>
</div>
```

### 4. User Search/Select (Optional - უკეთესი UX-ისთვის)

თუ გსურთ უკეთესი UX, შეგიძლიათ დამატოთ იუზერის ძიება:

```tsx
// User Search Component
const [searchQuery, setSearchQuery] = useState('');
const [users, setUsers] = useState([]);

useEffect(() => {
  if (searchQuery.length > 2) {
    // Search users by phone/name
    fetch(`${API_URL}/users/search?q=${searchQuery}`)
      .then(res => res.json())
      .then(data => setUsers(data));
  }
}, [searchQuery]);

// Then show dropdown with users
<Select>
  {users.map(user => (
    <SelectItem key={user.id} value={user.id}>
      {user.phone} - {user.firstName || user.name}
    </SelectItem>
  ))}
</Select>
```

## 📝 API Base URL

დარწმუნდით რომ admin panel-ში გაქვთ სწორი API URL:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
# ან production URL
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## ✅ რა ხდება როცა მინიჭება ხდება

1. **User-ის `ownedStores` array-ში** დაემატება store-ის ID
2. **Store-ის `ownerId`** განახლდება userId-ით
3. **იუზერი ავტომატურად** გახდება მაღაზიის პატრონი
4. **Partner Dashboard-ში** იუზერს ჩანს მაღაზია და შეუძლია:
   - სპეციალური შეთავაზებების დამატება
   - მოთხოვნების ნახვა
   - შეთავაზებების გაგზავნა

## 🧪 Testing

### 1. მაღაზიის მინიჭება:
```bash
curl -X PUT http://localhost:4000/auth/update-owned-stores \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr_1234567890",
    "storeId": "store_id_here",
    "action": "add"
  }'
```

### 2. მაღაზიის მოხსნა:
```bash
curl -X PUT http://localhost:4000/auth/update-owned-stores \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr_1234567890",
    "storeId": "store_id_here",
    "action": "remove"
  }'
```

## 📋 Checklist დეველოპერისთვის

- [ ] შექმნა `AssignStoreOwnerModal` component
- [ ] დამატება "Assign Owner" ღილაკი stores list page-ზე
- [ ] დამატება "Assign Owner" ღილაკი store edit page-ზე
- [ ] API call-ის ინტეგრაცია
- [ ] Error handling და toast notifications
- [ ] Loading states
- [ ] Success/Error messages ქართულად
- [ ] Testing - მაღაზიის მინიჭება/მოხსნა

## 🎯 მაგალითი გამოყენება

1. Admin panel-ში გადადი Stores გვერდზე
2. აირჩიე მაღაზია
3. დააჭირე "Assign Owner" ღილაკს
4. შეიყვანე იუზერის ID (მაგ: `usr_1234567890`)
5. დააჭირე "მინიჭება"
6. იუზერი ავტომატურად გახდება მაღაზიის პატრონი

## 🔗 დამატებითი ინფორმაცია

- Backend endpoint: `PUT /auth/update-owned-stores`
- DTO: `UpdateOwnedStoresDto`
- Service: `AuthService.updateOwnedStores()`
- Schema: User.ownedStores, Store.ownerId

---

**შენიშვნა**: ეს ფუნქციონალი carwash-ების მსგავსად მუშაობს (`update-owned-carwashes`), ასე რომ შეგიძლიათ გამოიყენოთ როგორც მაგალითი.


