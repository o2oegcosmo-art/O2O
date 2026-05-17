const { Client } = require('ssh2');
const fs = require('fs');

const HOST = '72.62.182.106';
const USER = 'u525164227';
const PASSWORD = 'Amzabola@224466';
const PUB_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDBUcrvraO0yHpnETqLTkSHs7i48rWggynyz/xevIcv9PP6vlFwzd9zb0mUocix3LSqXnkdqiE3F22Et59QF2Q9vPTH1eugFuAWYajxEVtz91nIUg5Q+xyDWc82n7rfvhgJWrvb+YyskBshxQKSKWKDCb4JmwXeCVEJdK6rNYRvFZ2kC9CRdjft+yTo2AiZH1pvkvBgIUanMorxUItru0aTdOkJ+pJlvZmdsBgkdk8d7x4xs9O/MAOdo0mwEom8ABoIe6FFd2k/BtNhp9OegBbPNGMGXRhhBHXmaYO36CJqvEc5o1Q2tTiGJT42/JJiJRFaoo8GPMtHYmfwWkoRC37v5FEPTop8mhfaIMTTJa8klHcT6lspqjAPlX52Vd/Co/DJ5yKTCoYnRQtrRF9gMvZSHL2z6Nn23aMvC/UNtvRAu4Wuekwv4Ak60kdeQkygJrNI+L4pULeFKSQbcfubsRVr+YeysfMzZUdz9Q1Ezz6iXxwx6CJNWobSaaIiBZhqhzsU7qnAP4ejgIdnDoerSZA7rapaT5UmzC4aNDssYtzt4XpBFNYa4KRfOPKyHhIwrk4c9SE9iVeA2nIgh0/jRWuC8yCHYr4pFJxYp/8j1WKIywi+Irk8DxixTyomwdY3ceSIn4NXpCq/KZhJztTqLZN2ODWOM7vv69MYsL6ZSFsztw== goodm@DESKTOP-46FBR7K';

function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        console.log(`\n>>> ${cmd.substring(0, 80)}...`);
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
    console.log('✅ Connected to server!\n');
    try {
        // 1. Add SSH public key
        await runCmd(conn, 'mkdir -p ~/.ssh && chmod 700 ~/.ssh');
        await runCmd(conn, `grep -qF "${PUB_KEY.substring(0,50)}" ~/.ssh/authorized_keys 2>/dev/null || echo "${PUB_KEY}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`);
        console.log('\n✅ SSH Key added to authorized_keys!');

        // 2. Find project root
        const root = await runCmd(conn, `
if [ -d /var/www/u525164227 ]; then echo '/var/www/u525164227';
elif [ -d /var/www/o2oeg ]; then echo '/var/www/o2oeg';
elif [ -f ~/public_html/index.php ]; then echo '~/public_html';
else ls -la ~ && echo 'UNKNOWN'; fi
        `);
        console.log('\nProject root candidate:', root.split('\n').pop());

        // 3. Check git status
        const gitRoot = await runCmd(conn, `find /var/www -name ".git" -maxdepth 3 2>/dev/null | head -5; find ~ -name ".git" -maxdepth 3 2>/dev/null | head -5`);
        console.log('\nGit repos found:', gitRoot);

        // 4. Pull code from GitHub
        if (gitRoot && gitRoot.trim()) {
            const repoDir = gitRoot.trim().split('\n')[0].replace('/.git', '');
            console.log(`\nDeploying to: ${repoDir}`);
            await runCmd(conn, `cd ${repoDir} && git fetch --all && git reset --hard origin/main && git status`);
            await runCmd(conn, `cd ${repoDir}/backend && composer install --no-dev --optimize-autoloader 2>&1 | tail -3`);
            await runCmd(conn, `cd ${repoDir}/backend && php artisan migrate --force && php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan optimize:clear`);
            console.log('\n\n🚀 DEPLOYMENT COMPLETE!');
        } else {
            console.log('\n⚠️ No git repo found on server. SSH key registered. Please check server path.');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    conn.end();
}).on('error', e => {
    console.error('Connection error:', e.message);
}).connect({ host: HOST, port: 22, username: USER, password: PASSWORD, readyTimeout: 30000 });
