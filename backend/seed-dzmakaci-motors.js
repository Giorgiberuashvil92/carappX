// ძმაკაცი მოტორსის სერვისების ბაზაში ჩაწერა
const admin = require('firebase-admin');

// Firebase კონფიგურაცია
const serviceAccount = require('./carapp.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://carapp-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

// ძმაკაცი მოტორსის მონაცემები
const dzmakaciMotorsData = {
  id: 'location_dzmakaci_motors_001',
  name: 'ძმაკაცი მოტორსი',
  phone: '+995 32 123 45 67',
  category: 'ავტოსერვისი',
  location: 'ვაჟა-ფშაველას გამზირი',
  address: 'რევაზ ურიდიას 205, თბილისი, საქართველო',
  price: 50, // საშუალო ფასი
  rating: 4.9, // Facebook-ის მიხედვით ძალიან მაღალი რეიტინგი
  reviews: 250, // Facebook-ზე მეტი მომხმარებელია
  socialMedia: {
    facebook: 'https://www.facebook.com/dzmakaci.official/',
    website: 'https://dzmakaci.ge/',
    instagram: '@dzmakaci_official'
  },
  services: 'საწვავის სისტემის მოვლა, ზეთის დანამატები, საპოხი მასალები, ჰიდრავლიკური დანამატები',
  
  // დეტალური სერვისები
  detailedServices: [
    {
      id: 'service_001',
      name: 'საწვავის სისტემის მოვლა',
      price: 35,
      duration: 45,
      description: 'საწვავის სისტემის სრული გაწმენდა და მოვლა, გამონაბოლქვის შემცირება'
    },
    {
      id: 'service_002', 
      name: 'ძრავის ზეთის დანამატები',
      price: 25,
      duration: 30,
      description: 'ძრავის ზეთის დანამატები, შეზეთვის გაუმჯობესება'
    },
    {
      id: 'service_003',
      name: 'საპოხი მასალების შეცვლა',
      price: 40,
      duration: 60,
      description: 'სხვადასხვა საპოხი მასალების შეცვლა და მოვლა'
    },
    {
      id: 'service_004',
      name: 'ჰიდრავლიკური დანამატები',
      price: 55,
      duration: 90,
      description: 'ჰიდრავლიკური სისტემების ეფექტურობის გაზრდა'
    },
    {
      id: 'service_005',
      name: 'ზეთის გამოცვლა',
      price: 30,
      duration: 45,
      description: 'ძრავის ზეთის სრული გამოცვლა'
    }
  ],

  // სამუშაო საათები
  workingHours: 'ორშაბათი-პარასკევი: 09:00-18:00, შაბათი: 10:00-16:00, კვირა: დახურული',
  
  // დროის სლოტების კონფიგურაცია
  timeSlotsConfig: {
    workingDays: [
      { day: 'monday', startTime: '09:00', endTime: '18:00', isWorking: true },
      { day: 'tuesday', startTime: '09:00', endTime: '18:00', isWorking: true },
      { day: 'wednesday', startTime: '09:00', endTime: '18:00', isWorking: true },
      { day: 'thursday', startTime: '09:00', endTime: '18:00', isWorking: true },
      { day: 'friday', startTime: '09:00', endTime: '18:00', isWorking: true },
      { day: 'saturday', startTime: '10:00', endTime: '16:00', isWorking: true },
      { day: 'sunday', startTime: '00:00', endTime: '00:00', isWorking: false }
    ],
    interval: 30, // 30 წუთიანი ინტერვალები
    breakTimes: [
      { start: '12:00', end: '13:00', name: 'სადილის შესვენება' }
    ]
  },

  // ხელმისაწვდომი სლოტები (შემდეგ გენერირება უნდა)
  availableSlots: [],

  // რეალური დროის სტატუსი
  realTimeStatus: {
    isOpen: true,
    currentWaitTime: 10, // Facebook-ის მიხედვით სწრაფი სერვისი
    currentQueue: 3,
    estimatedWaitTime: 30, // უფრო სწრაფი
    lastStatusUpdate: Date.now()
  },

  // დამატებითი ინფორმაცია
  features: 'პარკინგი, Wi-Fi, ყავა, პარტნიორობა გალფისთან',
  images: [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop'
  ],
  description: 'პროფესიონალური ავტოსერვისი საწვავის სისტემის მოვლისა და ზეთის დანამატების სპეციალისტი. ძმაკაცი მოტორსი უზრუნველყოფს ხარისხიან მომსახურებას თბილისში. Facebook-ზე აქტიური და პოპულარული კომპანია.',
  
  // კოორდინატები (ვაჟა-ფშაველას გამზირი 15)
  latitude: 41.7151,
  longitude: 44.8271,
  
  isOpen: true,
  ownerId: 'owner_dzmakaci_motors',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// ბაზაში ჩაწერა
async function seedDzmakaciMotors() {
  try {
    console.log('ძმაკაცი მოტორსის მონაცემების ბაზაში ჩაწერა...');
    
    await db.collection('carwash_locations').doc(dzmakaciMotorsData.id).set(dzmakaciMotorsData);
    
    console.log('✅ ძმაკაცი მოტორსის მონაცემები წარმატებით ჩაწერილია!');
    console.log('📍 ID:', dzmakaciMotorsData.id);
    console.log('🏢 სახელი:', dzmakaciMotorsData.name);
    console.log('📍 მისამართი:', dzmakaciMotorsData.address);
    console.log('⭐ რეიტინგი:', dzmakaciMotorsData.rating);
    console.log('💰 საშუალო ფასი:', dzmakaciMotorsData.price + '₾');
    console.log('🔧 სერვისების რაოდენობა:', dzmakaciMotorsData.detailedServices.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ შეცდომა ბაზაში ჩაწერისას:', error);
    process.exit(1);
  }
}

// სკრიპტის გაშვება
seedDzmakaciMotors();
