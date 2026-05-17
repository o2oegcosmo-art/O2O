const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

const REMOTE_PATH = '/var/www/o2oeg';
const BASE_LOCAL = 'g:\\O2OEG AI-FIRST SAAS PLATFORM';

// Files to sync
const filesToSync = [
    { local: 'backend/app/Http/Controllers/Api/BookingController.php', remote: 'backend/app/Http/Controllers/Api/BookingController.php' },
    { local: 'backend/database/seeders/MahmoudWilliamSeeder.php', remote: 'backend/database/seeders/MahmoudWilliamSeeder.php' },
    { local: 'backend/database/seeders/AdminUserSeeder.php', remote: 'backend/database/seeders/AdminUserSeeder.php' },
    { local: 'backend/database/migrations/2026_05_09_174554_create_video_projects_table.php', remote: 'backend/database/migrations/2026_05_09_174554_create_video_projects_table.php' }
];

const conn = new Client();

conn.on('ready', () => {
  console.log('📡 Connected to server for full deployment...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // 1. Upload Backend Files
    let uploadedCount = 0;
    filesToSync.forEach(file => {
        const localPath = path.join(BASE_LOCAL, file.local);
        const remotePath = path.join(REMOTE_PATH, file.remote).replace(/\\/g, '/');
        
        console.log(`📤 Uploading ${file.local}...`);
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) console.error(`Failed to upload ${file.local}:`, err);
            uploadedCount++;
            if (uploadedCount === filesToSync.length) {
                console.log('✅ All backend files uploaded.');
                deployFrontend();
            }
        });
    });

    function deployFrontend() {
        console.log('📤 Uploading frontend dist.tar.gz...');
        const localDist = path.join(BASE_LOCAL, 'frontend/dist.tar.gz');
        sftp.fastPut(localDist, `${REMOTE_PATH}/dist.tar.gz`, (err) => {
            if (err) throw err;
            console.log('✅ Frontend uploaded. Executing commands...');
            executeRemoteCommands();
        });
    }

    function executeRemoteCommands() {
        const commands = [
            `cd ${REMOTE_PATH} && tar -xzf dist.tar.gz`,
            `cp -r ${REMOTE_PATH}/dist/* ${REMOTE_PATH}/backend/public/`,
            `rm ${REMOTE_PATH}/dist.tar.gz`,
            `rm -rf ${REMOTE_PATH}/dist`,
            `cd ${REMOTE_PATH}/backend && php artisan migrate --force`,
            `echo "🚀 FULL DEPLOYMENT COMPLETE! Trial Page is LIVE."`
        ];

        const executeNext = (index) => {
            if (index >= commands.length) {
                conn.end();
                return;
            }
            const cmd = commands[index];
            console.log(`\n>>> ${cmd}`);
            conn.exec(cmd, (err, stream) => {
                if (err) throw err;
                stream.on('close', () => executeNext(index + 1))
                      .on('data', (data) => process.stdout.write(data.toString()))
                      .stderr.on('data', (data) => process.stderr.write(data.toString()));
            });
        };
        executeNext(0);
    }
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
