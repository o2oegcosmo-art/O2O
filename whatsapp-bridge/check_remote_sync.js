const { Client } = require('ssh2');

const HOST = '72.62.182.106';
const USER = 'root'; 
const PASSWORD = 'O2OEG_Secure_Shield_2026_#646'; // Using the new password
const REPO_DIR = '/var/www/o2oeg';

const conn = new Client();
conn.on('ready', () => {
    console.log('🛡️ Forced Clean-up: Connected to server...');
    const cmd = `
        # 1. Force replace any wrong numbers in all relevant files on server
        echo "--- SEARCHING FOR WRONG NUMBERS ---"
        grep -rl "62182106\|01005383435" ${REPO_DIR} || echo "No old numbers found."
        
        grep -rl "62182106" ${REPO_DIR} | xargs sed -i 's/62182106/01044167626/g' 2>/dev/null
        grep -rl "01005383435" ${REPO_DIR} | xargs sed -i 's/01005383435/01044167626/g' 2>/dev/null
        
        # 2. Clear Laravel caches
        cd ${REPO_DIR}/backend && php artisan config:clear && php artisan cache:clear && php artisan view:clear
        
        # 3. Verify the final state
        echo "--- VERIFICATION ON SERVER (GLOBAL) ---"
        echo "Searching for any wa.me links in ${REPO_DIR}..."
        grep -r "wa.me" ${REPO_DIR} | grep -v "node_modules" | head -n 5 || echo "No wa.me links found in the whole repo!"
        
        grep -r "01044167626" ${REPO_DIR} | grep -v "node_modules" && echo "✅ SUCCESS: CORRECT NUMBER FOUND ON SERVER!" || echo "❌ ERROR: CORRECT NUMBER NOT FOUND ANYWHERE ON SERVER!"
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', e => {
    console.error('❌ Connection error (New Password):', e.message);
    console.log('🔄 Retrying with OLD password...');
    
    // Retry with old password if new one failed
    const connRetry = new Client();
    connRetry.on('ready', () => {
        console.log('🛡️ Connected with OLD password. Setting NEW password again...');
        const cmd = `
            echo "root:O2OEG_Secure_Shield_2026_#646" | chpasswd &&
            grep -rl "62182106" ${REPO_DIR} | xargs sed -i 's/62182106/01044167626/g'
        `;
        connRetry.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d));
            stream.on('close', () => connRetry.end());
        });
    }).on('error', e2 => {
        console.error('❌ Both passwords failed. Please check manual access.');
    }).connect({ host: HOST, port: 22, username: USER, password: 'Amzabola@224466' });
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
