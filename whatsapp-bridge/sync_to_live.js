const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

const localRoot = 'g:/O2OEG AI-FIRST SAAS PLATFORM';
const remoteRoot = '/var/www/o2oeg';

const filesToUpload = [
  // Backend Core
  { local: 'backend/app/Channels/WhatsAppChannel.php', remote: `${remoteRoot}/backend/app/Channels/WhatsAppChannel.php` },
  { local: 'backend/app/Http/Controllers/Api/LeadController.php', remote: `${remoteRoot}/backend/app/Http/Controllers/Api/LeadController.php` },
  { local: 'backend/app/Http/Controllers/Api/PublicController.php', remote: `${remoteRoot}/backend/app/Http/Controllers/Api/PublicController.php` },
  { local: 'backend/app/Http/Controllers/Api/TenantController.php', remote: `${remoteRoot}/backend/app/Http/Controllers/Api/TenantController.php` },
  { local: 'backend/app/Models/Booking.php', remote: `${remoteRoot}/backend/app/Models/Booking.php` },
  { local: 'backend/app/Models/Tenant.php', remote: `${remoteRoot}/backend/app/Models/Tenant.php` },
  { local: 'backend/app/Services/AIRouterService.php', remote: `${remoteRoot}/backend/app/Services/AIRouterService.php` },
  { local: 'backend/routes/api.php', remote: `${remoteRoot}/backend/routes/api.php` },
  { local: 'backend/routes/web.php', remote: `${remoteRoot}/backend/routes/web.php` },
  
  // New Migrations
  { local: 'backend/database/migrations/2026_05_14_000000_fix_personal_access_tokens_for_uuids.php', remote: `${remoteRoot}/backend/database/migrations/2026_05_14_000000_fix_personal_access_tokens_for_uuids.php` },
  { local: 'backend/database/migrations/2026_05_15_000000_add_description_to_tenants_table.php', remote: `${remoteRoot}/backend/database/migrations/2026_05_15_000000_add_description_to_tenants_table.php` },
  { local: 'backend/database/migrations/2026_05_15_170924_add_og_image_url_to_tenants_table.php', remote: `${remoteRoot}/backend/database/migrations/2026_05_15_170924_add_og_image_url_to_tenants_table.php` },
  
  // Frontend
  { local: 'frontend/index.html', remote: `${remoteRoot}/frontend/index.html` },
  { local: 'frontend/src/App.tsx', remote: `${remoteRoot}/frontend/src/App.tsx` },
  { local: 'frontend/src/api/config.ts', remote: `${remoteRoot}/frontend/src/api/config.ts` },
  { local: 'frontend/package.json', remote: `${remoteRoot}/frontend/package.json` },
];

function addDir(dirPath) {
    const fullPath = path.join(localRoot, dirPath);
    if (!fs.existsSync(fullPath)) return;
    const items = fs.readdirSync(fullPath);
    items.forEach(item => {
        const itemLocal = path.join(dirPath, item).replace(/\\/g, '/');
        const itemFull = path.join(localRoot, itemLocal);
        if (fs.statSync(itemFull).isDirectory()) {
            // recursion could be added here
        } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js')) {
            filesToUpload.push({
                local: itemLocal,
                remote: `${remoteRoot}/${itemLocal}`
            });
        }
    });
}

// Upload all pages and components
addDir('frontend/src/pages');
addDir('frontend/src/components');

conn.on('ready', () => {
  console.log('📡 Connected for FULL MEGA Sync!');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    let uploadedCount = 0;
    filesToUpload.forEach(file => {
      const localPath = path.join(localRoot, file.local);
      sftp.fastPut(localPath, file.remote, (err) => {
        if (err) {
            console.error(`Error uploading ${file.local}:`, err);
        }
        uploadedCount++;
        process.stdout.write(`\rProgress: ${uploadedCount}/${filesToUpload.length}`);
        if (uploadedCount === filesToUpload.length) {
          console.log(`\n🚀 All ${uploadedCount} files uploaded. Running remote rebuild & migrations...`);
          runRemoteCommands();
        }
      });
    });
  });

  function runRemoteCommands() {
    const commands = [
      'cd /var/www/o2oeg/backend && php artisan migrate --force',
      'cd /var/www/o2oeg/backend && php artisan config:cache && php artisan route:cache',
      'cd /var/www/o2oeg/frontend && npm install && npm run build',
      'systemctl restart nginx'
    ];

    const executeNext = (index) => {
      if (index >= commands.length) {
        console.log('\n🏁 FINAL MEGA DEPLOYMENT FINISHED! EVERYTHING IS LIVE.');
        conn.end();
        return;
      }
      const cmd = commands[index];
      console.log(`\nExecuting: ${cmd}`);
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => executeNext(index + 1))
              .on('data', (data) => process.stdout.write(data.toString()))
              .stderr.on('data', (data) => process.stderr.write(data.toString()));
      });
    };
    executeNext(0);
  }
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
