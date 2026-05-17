const { Client } = require('ssh2');

const HOST = '72.62.182.106';
const USER = 'root';
const PASSWORD = 'O2OEG_Secure_Shield_2026_#646';

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
    console.log('✅ Connected to Hostinger server!\n');
    try {
        // 1. Identify backend path
        const findBackend = await runCmd(conn, 'find /var/www -name "CheckSubscription.php" -path "*/Middleware/*" 2>/dev/null | head -1');
        const middlewarePath = findBackend.trim();
        
        if (!middlewarePath) {
            throw new Error('Could not find CheckSubscription.php on server.');
        }
        console.log(`Found middleware at: ${middlewarePath}`);

        // 2. Fix CheckSubscription.php logic (Change 401 to 403 for Tenant missing)
        // This prevents the frontend interceptor from clearing the session
        const fixLogic = `sed -i 's/return response()->json(\\["message" => "Unauthorized: No Tenant context found."\\], 401);/return response()->json(\\["message" => "Forbidden: No Tenant context found."\\], 403);/g' ${middlewarePath}`;
        await runCmd(conn, fixLogic);
        console.log('✅ Updated CheckSubscription.php logic.');

        // 3. Clear cache to ensure changes take effect
        const backendDir = middlewarePath.split('/app/Http')[0];
        await runCmd(conn, `cd ${backendDir} && php artisan config:clear && php artisan cache:clear`);

        console.log('\n🚀 PRODUCTION LOGOUT FIX COMPLETE!');
    } catch (e) {
        console.error('Error:', e.message);
    }
    conn.end();
}).on('error', e => {
    console.error('Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD });
