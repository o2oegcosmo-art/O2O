const axios = require('axios');

async function testBridge() {
    const tenantId = '00000000-0000-0000-0000-000000000000';
    console.log(`Checking status for tenant: ${tenantId}`);
    try {
        const res = await axios.get(`http://localhost:9000/status/${tenantId}`);
        console.log('Status Response:', res.data);
    } catch (e) {
        console.log('Status Error:', e.response ? e.response.status : e.message);
    }

    console.log('\nTrying to connect (POST /connect)...');
    try {
        const res = await axios.post(`http://localhost:9000/connect/${tenantId}`);
        console.log('Connect Response:', res.data);
    } catch (e) {
        console.log('Connect Error:', e.response ? e.response.status : e.message);
    }
}

testBridge();
