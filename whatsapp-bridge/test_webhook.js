const axios = require('axios');
const LARAVEL_WEBHOOK_URL = 'https://o2oeg.com/api/webhooks/whatsapp';
const BRIDGE_API_KEY = 'o2oeg_bridge_secret_2026_z8v9';

async function test() {
    console.log('Testing connection to Laravel Webhook...');
    try {
        const response = await axios.post(LARAVEL_WEBHOOK_URL, {
            tenant_id: '00000000-0000-0000-0000-000000000000',
            entry: [{ changes: [{ value: { messages: [{ from: 'test', text: { body: 'test connection' } }] } }] }]
        }, {
            headers: { 'X-Bridge-Key': BRIDGE_API_KEY }
        });
        console.log('SUCCESS! Status:', response.status);
    } catch (err) {
        console.error('FAILED! Error:', err.message);
        if (err.response) console.error('Response Body:', JSON.stringify(err.response.data));
    }
}
test();
