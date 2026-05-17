const { Client } = require('ssh2');

const HOST = '72.62.182.106';
const USER = 'u525164227';
const PASSWORD = 'Amzabola@224466';

function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        console.log(`\n>>> EXECUTING: ${cmd}`);
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
    console.log('✅ Connected to Hostinger Server!\n');
    try {
        // 1. Locate and Pull latest code
        const repoDir = '/var/www/u525164227/public_html'; 
        console.log(`🚀 Deploying to: ${repoDir}`);
        
        await runCmd(conn, `cd ${repoDir} && git fetch --all && git reset --hard origin/main`);
        
        // 2. Kill and Restart the WhatsApp Bridge
        console.log('⚡ Restarting WhatsApp Bridge...');
        await runCmd(conn, `pkill -f "node index.js" || true`);
        await runCmd(conn, `cd ${repoDir}/whatsapp-bridge && nohup node index.js > bridge.log 2>&1 &`);
        
        // 3. Clear Laravel Cache
        console.log('🧹 Clearing Laravel Cache...');
        await runCmd(conn, `cd ${repoDir}/backend && php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan optimize:clear`);

        console.log('\n\n✅ ALL SYSTEMS RESTARTED ON HOSTINGER!');
    } catch (e) {
        console.error('❌ Error during remote restart:', e.message);
    }
    conn.end();
}).on('error', e => {
    console.error('❌ Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD, readyTimeout: 30000 });
