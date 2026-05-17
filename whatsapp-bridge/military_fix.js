const { Client } = require('ssh2');
const fs = require('fs');

const HOST = '72.62.182.106';
const PASSWORD = 'Amzabola@224466';

async function tryConnect(user) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => resolve(conn))
            .on('error', (err) => reject(err))
            .connect({
                host: HOST,
                port: 22,
                username: user,
                password: PASSWORD,
                readyTimeout: 60000
            });
    });
}

async function runCmd(conn, cmd) {
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

async function start() {
    let conn;
    try {
        console.log(`Trying to connect as root...`);
        conn = await tryConnect('root');
    } catch (e) {
        console.log(`Root failed: ${e.message}. Trying u525164227...`);
        try {
            conn = await tryConnect('u525164227');
        } catch (e2) {
            console.error(`Both users failed. Last error: ${e2.message}`);
            process.exit(1);
        }
    }

    console.log('✅ Connected successfully!');
    try {
        const findBackend = await runCmd(conn, 'find /var/www -name "ServiceController.php" -path "*/Api/*" 2>/dev/null | head -1');
        let controllerPath = findBackend.trim();
        
        if (!controllerPath) {
             console.log("Could not find ServiceController.php via find, trying default...");
             controllerPath = "/var/www/o2oeg/backend/app/Http/Controllers/Api/ServiceController.php";
        }
        console.log(`Target: ${controllerPath}`);
        
        const backendDir = controllerPath.split('/app/Http')[0];

        // Robust replacement
        await runCmd(conn, `sed -i "s|'\\/storage\\/' . \\$path|url('storage/' . \\$path)|g" ${controllerPath}`);
        await runCmd(conn, `sed -i "s|'\\/storage\\/' . \\$path|url('storage/' . \\$path)|g" ${controllerPath}`); // Double check
        
        const envPath = `${backendDir}/.env`;
        await runCmd(conn, `sed -i 's|^APP_URL=.*|APP_URL=https://o2oeg.com|' ${envPath}`);
        await runCmd(conn, `cd ${backendDir} && php artisan storage:link || true`);
        await runCmd(conn, `cd ${backendDir} && php artisan optimize:clear`);

        console.log('\n🚀 PRODUCTION SYSTEM FIXED!');
    } catch (e) {
        console.error('Execution error:', e.message);
    }
    conn.end();
}

start();
