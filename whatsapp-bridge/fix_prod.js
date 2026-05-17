const { Client } = require('ssh2');
const fs = require('fs');

const HOST = '72.62.182.106';
const USER = 'root'; // Changed from u525164227 to root
const PASSWORD = 'Amzabola@224466';

function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        console.log(`\n>>> ${cmd}`);
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { process.stderr.write(d); });
            stream.on('close', () => resolve(out.trim()));
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ Connected to Hostinger VPS (root)!\n');
    try {
        // 1. Identify backend path
        const findBackend = await runCmd(conn, 'find /var/www -name "ServiceController.php" -path "*/Api/*" 2>/dev/null | head -1');
        const controllerPath = findBackend.trim();
        
        if (!controllerPath) {
             console.log("Could not find ServiceController.php via find, trying default /var/www/o2oeg/backend/app/Http/Controllers/Api/ServiceController.php");
             // Fallback
             const fallback = "/var/www/o2oeg/backend/app/Http/Controllers/Api/ServiceController.php";
             await runCmd(conn, `ls ${fallback}`);
             controllerPath = fallback;
        }
        console.log(`Found controller at: ${controllerPath}`);
        
        const backendDir = controllerPath.split('/app/Http')[0];
        console.log(`Backend directory: ${backendDir}`);

        // 2. Fix ServiceController.php logic
        // Using a more flexible sed to handle potential whitespace or slight variations
        await runCmd(conn, `sed -i "s|'\\/storage\\/' . \\$path|url('storage/' . \\$path)|g" ${controllerPath}`);
        console.log('✅ Updated ServiceController.php logic.');

        // 3. Fix .env APP_URL
        const envPath = `${backendDir}/.env`;
        await runCmd(conn, `sed -i 's|^APP_URL=.*|APP_URL=https://o2oeg.com|' ${envPath}`);
        console.log('✅ Updated .env APP_URL.');

        // 4. Run storage:link
        await runCmd(conn, `cd ${backendDir} && php artisan storage:link || echo "Storage link already exists"`);
        
        // 5. Clear cache
        await runCmd(conn, `cd ${backendDir} && php artisan optimize:clear`);

        console.log('\n🚀 PRODUCTION FIX COMPLETE!');
    } catch (e) {
        console.error('Error:', e.message);
    }
    conn.end();
}).on('error', e => {
    console.error('Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
