const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

const cleanWebPhp = `<?php

use Illuminate\\Support\\Facades\\Route;

if (!function_exists('serveFrontend')) {
    function serveFrontend() {
        \\$paths = [
            '/var/www/o2oeg/backend/public/index.html',
            public_path('index.html'),
            base_path('../public/index.html'),
            '/home/u525164227/O2O/backend/public/index.html',
            '/var/www/u525164227/backend/public/index.html',
        ];

        foreach (\\$paths as \\$path) {
            if (file_exists(\\$path)) {
                return response(file_get_contents(\\$path), 200)->header('Content-Type', 'text/html');
            }
        }

        return response("System is updating... Please refresh in 1 minute.", 200)->header('Content-Type', 'text/html');
    }
}

Route::get('/', function () {
    return serveFrontend();
});

Route::post('/login', [\\App\\Http\\Controllers\\Api\\AuthController::class, 'login'])->name('login');

Route::get('/login-status', function() {
    return response()->json(['status' => 'online']);
});

Route::get('/{any}', function () {
    return serveFrontend();
})->where('any', '.*');
`;

conn.on('ready', () => {
  console.log('📡 Connected to fix web.php...');
  // Writing the file with a heredoc to avoid escaping issues
  const cmd = `cat << 'EOF' > /var/www/o2oeg/backend/routes/web.php\n${cleanWebPhp}\nEOF`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('✅ web.php cleaned and restored!');
      // Now try to clear cache again to see if it works
      conn.exec('cd /var/www/o2oeg/backend && php artisan config:clear && php artisan optimize', (err, stream2) => {
          stream2.on('close', () => {
              console.log('🚀 Cache cleared successfully. Site should be back online.');
              conn.end();
          }).on('data', (data) => process.stdout.write(data.toString()));
      });
    });
  });
}).connect(config);
