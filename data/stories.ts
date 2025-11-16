import { Story } from '../types/story';

export const mockStories: Story[] = [
  {
    id: 'me-1',
    author: { id: 'me', name: 'ჩემი მანქანა', avatar: 'https://i.pravatar.cc/100?img=1' },
    createdAt: Date.now() - 1000 * 60 * 30,
    category: 'my-car',
    items: [
      {
        id: 'me-1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop',
        durationMs: 6000,
        caption: 'დღევანდელი გარბენი: 32კმ \nსაწვავი: -5.2ლ',
      },
      {
        id: 'me-1-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop',
        durationMs: 6000,
        caption: 'რემაინდერი: ზეთის შეცვლა 12 დღეში',
        poll: {
          id: 'poll-1',
          question: 'რა carwash გირჩევნია?',
          options: [
            { id: 'opt-eco', label: 'Eco Foam', votes: 12 },
            { id: 'opt-prem', label: 'Premium Wash', votes: 19 },
          ],
        },
      },
    ],
  },
  {
    id: 'fr-1',
    author: { id: 'gio', name: 'Gio', avatar: 'https://i.pravatar.cc/100?img=5' },
    createdAt: Date.now() - 1000 * 60 * 90,
    category: 'friends',
    items: [
      {
        id: 'fr-1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1453491945771-a1e904948959?q=80&w=1200&auto=format&fit=crop',
        durationMs: 6000,
        caption: 'ახალი დისკები 🔥',
      },
    ],
  },
  {
    id: 'svc-1',
    author: { id: 'svc', name: 'AutoWash Pro', avatar: 'https://i.pravatar.cc/100?img=12' },
    createdAt: Date.now() - 1000 * 60 * 10,
    category: 'services',
    highlight: true,
    items: [
      {
        id: 'svc-1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1554744512-d6b8a6e67d02?q=80&w=1200&auto=format&fit=crop',
        durationMs: 6000,
        caption: 'Story Highlight: -30% დღეს',
      },
    ],
  },
];


