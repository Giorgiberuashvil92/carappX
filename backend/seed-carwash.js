const axios = require('axios');

const BASE_URL = 'http://localhost:4000/carwash';

async function seedCarWashData() {
  try {
    console.log('🌱 Starting to seed car wash data...');
    
    // Seed all data at once
    const response = await axios.post(`${BASE_URL}/seed/all`);
    console.log('✅ Response:', response.data);
    
    console.log('🎉 Car wash data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error.response?.data || error.message);
  }
}

// Run the seeding
seedCarWashData();
