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

const LOCAL_DIST = 'G:\\O2OEG AI-FIRST SAAS PLATFORM\\frontend\\dist';
const REMOTE_DIST = '/var/www/o2oeg/backend/public';

async function uploadDir(sftp, localDir, remoteDir) {
  // Create remote dir
  await new Promise((res) => sftp.mkdir(remoteDir, () => res()));
  
  const items = fs.readdirSync(localDir, { withFileTypes: true });
  for (const item of items) {
    const localPath = path.join(localDir, item.name);
    const remotePath = `${remoteDir}/${item.name}`;
    
    if (item.isDirectory()) {
      await uploadDir(sftp, localPath, remotePath);
    } else {
      await new Promise((res, rej) => {
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) { console.error('Failed:', remotePath, err.message); rej(err); }
          else { process.stdout.write('.'); res(); }
        });
      });
    }
  }
}

console.log('🚀 Deploying Frontend Build to Live Server...');

conn.on('ready', async () => {
  console.log('📡 Connected!');
  
  conn.sftp(async (err, sftp) => {
    if (err) throw err;
    
    try {
      console.log('📤 Uploading dist/ files...');
      await uploadDir(sftp, LOCAL_DIST, REMOTE_DIST);
      console.log('\n✅ All files uploaded!');
      console.log('🔥 Frontend is now LIVE with the critical login fix!');
    } catch (e) {
      console.error('\n❌ Upload error:', e.message);
    } finally {
      conn.end();
    }
  });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
