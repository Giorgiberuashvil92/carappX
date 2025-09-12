const axios = require('axios');

const BASE_URL = 'http://localhost:4000/carwash';

async function testCarWashAPI() {
  try {
    console.log('🧪 Testing Car Wash API endpoints...\n');

    // Test 1: Get all bookings
    console.log('1️⃣ Testing GET /carwash/bookings');
    try {
      const bookingsResponse = await axios.get(`${BASE_URL}/bookings`);
      console.log('✅ Bookings fetched:', bookingsResponse.data.length, 'bookings');
      console.log('📋 Sample booking:', JSON.stringify(bookingsResponse.data[0], null, 2));
    } catch (error) {
      console.log('❌ Error fetching bookings:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get bookings by user ID
    console.log('2️⃣ Testing GET /carwash/bookings?userId=user_123');
    try {
      const userBookingsResponse = await axios.get(`${BASE_URL}/bookings?userId=user_123`);
      console.log('✅ User bookings fetched:', userBookingsResponse.data.length, 'bookings');
      console.log('📋 User bookings:', userBookingsResponse.data.map(b => ({
        id: b.id,
        location: b.locationName,
        service: b.serviceName,
        status: b.status,
        date: new Date(b.bookingDate).toLocaleDateString()
      })));
    } catch (error) {
      console.log('❌ Error fetching user bookings:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get specific booking
    console.log('3️⃣ Testing GET /carwash/bookings/booking_1');
    try {
      const bookingResponse = await axios.get(`${BASE_URL}/bookings/booking_1`);
      console.log('✅ Specific booking fetched:');
      console.log('📋 Booking details:', JSON.stringify(bookingResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error fetching specific booking:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Create new booking
    console.log('4️⃣ Testing POST /carwash/bookings');
    const newBooking = {
      userId: 'user_123',
      locationId: 'location_1',
      locationName: 'CAR WASH CENTER',
      locationAddress: 'რუსთაველის გამზირი 15, თბილისი',
      serviceId: 'service_1',
      serviceName: 'სრული სამრეცხაო',
      servicePrice: 15,
      bookingDate: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5 days from now
      bookingTime: '14:30',
      carInfo: {
        make: 'Tesla',
        model: 'Model 3',
        year: '2023',
        licensePlate: 'TB-TESLA-001',
        color: 'თეთრი'
      },
      customerInfo: {
        name: 'გიორგი ნათაძე',
        phone: '+995 555 123 456',
        email: 'giorgi@example.com'
      }
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/bookings`, newBooking);
      console.log('✅ New booking created:');
      console.log('📋 Created booking ID:', createResponse.data.id);
      console.log('📋 Booking details:', JSON.stringify(createResponse.data, null, 2));
      
      const newBookingId = createResponse.data.id;

      console.log('\n' + '='.repeat(50) + '\n');

      // Test 5: Update booking
      console.log('5️⃣ Testing PATCH /carwash/bookings/' + newBookingId);
      try {
        const updateResponse = await axios.patch(`${BASE_URL}/bookings/${newBookingId}`, {
          bookingTime: '15:00',
          carInfo: {
            ...newBooking.carInfo,
            color: 'შავი'
          }
        });
        console.log('✅ Booking updated:');
        console.log('📋 Updated booking:', JSON.stringify(updateResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Error updating booking:', error.response?.data || error.message);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // Test 6: Confirm booking
      console.log('6️⃣ Testing PATCH /carwash/bookings/' + newBookingId + '/confirm');
      try {
        const confirmResponse = await axios.patch(`${BASE_URL}/bookings/${newBookingId}/confirm`);
        console.log('✅ Booking confirmed:');
        console.log('📋 Confirmed booking status:', confirmResponse.data.status);
      } catch (error) {
        console.log('❌ Error confirming booking:', error.response?.data || error.message);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // Test 7: Start booking
      console.log('7️⃣ Testing PATCH /carwash/bookings/' + newBookingId + '/start');
      try {
        const startResponse = await axios.patch(`${BASE_URL}/bookings/${newBookingId}/start`);
        console.log('✅ Booking started:');
        console.log('📋 Started booking status:', startResponse.data.status);
      } catch (error) {
        console.log('❌ Error starting booking:', error.response?.data || error.message);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // Test 8: Complete booking
      console.log('8️⃣ Testing PATCH /carwash/bookings/' + newBookingId + '/complete');
      try {
        const completeResponse = await axios.patch(`${BASE_URL}/bookings/${newBookingId}/complete`);
        console.log('✅ Booking completed:');
        console.log('📋 Completed booking status:', completeResponse.data.status);
      } catch (error) {
        console.log('❌ Error completing booking:', error.response?.data || error.message);
      }

      console.log('\n' + '='.repeat(50) + '\n');

      // Test 9: Delete booking
      console.log('9️⃣ Testing DELETE /carwash/bookings/' + newBookingId);
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/bookings/${newBookingId}`);
        console.log('✅ Booking deleted:', deleteResponse.data);
      } catch (error) {
        console.log('❌ Error deleting booking:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Error creating booking:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 10: Get bookings by location
    console.log('10️⃣ Testing GET /carwash/locations/location_1/bookings');
    try {
      const locationBookingsResponse = await axios.get(`${BASE_URL}/locations/location_1/bookings`);
      console.log('✅ Location bookings fetched:', locationBookingsResponse.data.length, 'bookings');
      console.log('📋 Location bookings:', locationBookingsResponse.data.map(b => ({
        id: b.id,
        service: b.serviceName,
        status: b.status,
        date: new Date(b.bookingDate).toLocaleDateString()
      })));
    } catch (error) {
      console.log('❌ Error fetching location bookings:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 11: Get bookings by date
    const today = new Date().toISOString().split('T')[0];
    console.log('11️⃣ Testing GET /carwash/bookings/date/' + today);
    try {
      const dateBookingsResponse = await axios.get(`${BASE_URL}/bookings/date/${today}`);
      console.log('✅ Date bookings fetched:', dateBookingsResponse.data.length, 'bookings');
      console.log('📋 Date bookings:', dateBookingsResponse.data.map(b => ({
        id: b.id,
        location: b.locationName,
        service: b.serviceName,
        status: b.status
      })));
    } catch (error) {
      console.log('❌ Error fetching date bookings:', error.response?.data || error.message);
    }

    console.log('\n🎉 All API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testCarWashAPI();
