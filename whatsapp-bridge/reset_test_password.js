const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

conn.on('ready', () => {
  console.log('📡 Connected - Final Fix');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    // Write a standalone PHP script to the server via SFTP (NOT shell)
    // This avoids ALL shell escaping issues completely
    const phpCode = `<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=o2oeg', 'o2o_user', 'Amzabola@224466');
$hash = password_hash('TestPass123', PASSWORD_BCRYPT, ['cost' => 12]);
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE phone = '01099999999'");
$stmt->execute([$hash]);
$rows = $stmt->rowCount();
echo "UPDATED_ROWS: $rows - HASH_START: " . substr($hash, 0, 7) . PHP_EOL;
`;

    const writeStream = sftp.createWriteStream('/tmp/fix_pw_final.php');
    writeStream.write(phpCode);
    writeStream.end();

    writeStream.on('close', () => {
      console.log('✅ PHP script uploaded. Running...');
      conn.exec('php /tmp/fix_pw_final.php && rm -f /tmp/fix_pw_final.php', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log('🏁 Done!');
          conn.end();
        })
        .on('data', (data) => console.log('RESULT: ' + data.toString()))
        .stderr.on('data', (data) => console.log('ERR: ' + data.toString()));
      });
    });
  });
}).on('error', (err) => console.error('❌', err)).connect(config);
