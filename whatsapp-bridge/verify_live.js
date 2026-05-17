const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = 'cd /var/www/o2oeg && git log --oneline -3 && echo "---ARABIC CHECK---" && grep -c "صباحاً" backend/app/Http/Controllers/Api/AIController.php && echo "---OLLAMA CHECK (should be 0)---" && grep -c "127.0.0.1:11434" backend/app/Services/AIRouterService.php';
  conn.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      console.log('\n✅ Verification Complete!');
      conn.end();
    });
  });
}).connect({ host: '72.62.182.106', port: 22, username: 'root', password: 'Amzabola@224466' });
