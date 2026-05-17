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
    console.log('✅ Connected to Hostinger Server for Deep Cleanup!\n');
    try {
        // 1. Clear RAM and Swap if possible (limit processes)
        console.log('🧹 Cleaning up zombie processes...');
        await runCmd(conn, 'pkill -u u525164227 node || true');
        await runCmd(conn, 'pkill -u u525164227 php || true');
        
        // 2. Restart Ollama (assuming it might be stuck)
        console.log('⚡ Restarting Ollama...');
        await runCmd(conn, 'systemctl restart ollama || (pkill ollama && nohup ollama serve > ollama.log 2>&1 &)');
        
        // 3. Restart Bridge
        console.log('⚡ Restarting Bridge...');
        const repoDir = '/var/www/o2oeg';
        await runCmd(conn, `cd ${repoDir}/whatsapp-bridge && nohup node index.js > bridge.log 2>&1 &`);

        // 4. Optimize Laravel
        console.log('🧹 Optimizing Laravel...');
        await runCmd(conn, `cd ${repoDir}/backend && php artisan optimize:clear && php artisan config:cache && php artisan route:cache`);

        console.log('\n\n✅ DEEP CLEANUP COMPLETE!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).on('error', e => {
    console.error('❌ Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD, readyTimeout: 30000 });
