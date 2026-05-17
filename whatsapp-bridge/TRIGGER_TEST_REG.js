const axios = require('axios');

async function testRegistration() {
    console.log('🚀 Sending Test Registration Request to Live Server...');
    try {
        const response = await axios.post('https://o2oeg.com/api/register', {
            name: 'تجربة النظام الآلي',
            phone: '01066224488', // Another fresh test number
            password: 'password123',
            salon_name: 'صالون التجربة التقنية'
        });
        console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testRegistration();
