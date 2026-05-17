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
        const repoDir = '/var/www/o2oeg'; 
        
        console.log('📊 CHECKING BRIDGE LOGS...');
        await runCmd(conn, `tail -n 30 ${repoDir}/whatsapp-bridge/bridge.log`);

        console.log('\n📊 CHECKING LARAVEL LOGS...');
        await runCmd(conn, `tail -n 20 ${repoDir}/backend/storage/logs/laravel.log`);

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).on('error', e => {
    console.error('❌ Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD, readyTimeout: 30000 });
