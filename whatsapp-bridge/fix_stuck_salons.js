const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '72.62.182.106',
  port: 22,
  username: 'root',
  password: 'O2OEG_Secure_Shield_2026_#646'
};

console.log('🧐 Searching for stuck salons without subscriptions...');

conn.on('ready', () => {
  console.log('📡 Connected!');
  
  // Use tinker to find and fix tenants without subscriptions
  const phpCode = `
    $tenants = \\App\\Models\\Tenant::doesntHave('activeSubscription')->get();
    echo "FOUND_STUCK:" . $tenants->count() . "\\n";
    foreach($tenants as $t) {
        echo "FIXING_TENANT:" . $t->name . " (ID: " . $t->id . ")\\n";
        
        // 1. Create Free Subscription
        $freePlan = \\App\\Models\\Plan::where('slug', 'free')->first();
        if ($freePlan) {
            \\App\\Models\\Subscription::updateOrCreate(
                ['tenant_id' => $t->id, 'status' => 'active'],
                [
                    'plan_id' => $freePlan->id,
                    'starts_at' => now(),
                    'ends_at' => now()->addYears(10),
                ]
            );
        }
        
        // 2. Activate Core Services
        $coreServices = \\App\\Models\\Service::whereIn('slug', [
            'smart-booking-system',
            'crm-system',
            'public-page',
            'e-commerce'
        ])->get();
        foreach ($coreServices as $service) {
            if (!$t->services()->where('service_id', $service->id)->exists()) {
                $t->services()->attach($service->id, ['status' => 'active', 'activated_at' => now()]);
            }
        }
        
        // 3. Mark Onboarding as Completed
        $t->onboarding_completed = true;
        $t->save();
    }
  `;

  const commands = [
    `cd /var/www/o2oeg/backend && php artisan tinker --execute="${phpCode.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`
  ];

  const executeNext = (index) => {
    if (index >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[index];
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => executeNext(index + 1))
            .on('data', (data) => process.stdout.write(data.toString()))
            .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
  };
  executeNext(0);
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect(config);
