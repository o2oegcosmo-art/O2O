<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Lead;

class SystemIntegrityPurge extends Command
{
    /**
     * الأمر: php artisan system:purge-accounts
     */
    protected $signature = 'system:purge-accounts {--force : تجاوز التأكيد}';

    protected $description = 'مسح شامل لكافة البيانات التجريبية: حسابات، محادثات AI، تنبيهات واتساب، وعمليات مالية.';

    public function handle()
    {
        // تحديد الـ Tenant الأساسي للمنصة (الذي لا يجب مسحه)
        $adminTenant = Tenant::where('name', 'LIKE', '%Platform Admin%')->first();
        $adminTenantId = $adminTenant ? $adminTenant->id : 1;

        $this->info('📊 جاري فحص قاعدة البيانات لإعداد تقرير التصفية...');

        // تجميع الإحصائيات قبل المسح
        $stats = [
            ['الرسائل ومحادثات الـ AI', DB::table('messages')->count()],
            ['التنبيهات (WhatsApp/System)', DB::table('notifications')->count()],
            ['الحجوزات والجدولة', DB::table('bookings')->count()],
            ['العمليات المالية والاشتراكات (الديون)', DB::table('payments')->count() + DB::table('subscriptions')->count()],
            ['العملاء والمهتمين (Leads/CRM)', Lead::count() + DB::table('crm_clients')->count()],
            ['الموظفين والفرق', DB::table('staff')->count()],
            ['المستخدمين (باستثناء الأدمن الأساسي)', User::where('email', '!=', 'admin@o2oeg.com')
                ->where(function($q) use ($adminTenantId) {
                    $q->where('tenant_id', '!=', $adminTenantId)->orWhereNull('tenant_id');
                })->count()],
            ['الصالونات والشركات المسجلة', Tenant::where('id', '!=', $adminTenantId)->count()],
        ];

        $this->table(['نوع البيانات', 'العدد الإجمالي المستهدف'], $stats);

        if (!$this->option('force')) {
            if (!$this->confirm('⚠️ هل أنت متأكد من رغبتك في حذف كافة هذه السجلات نهائياً والبدء ببيئة نظيفة؟')) {
                return $this->info('تم إلغاء العملية. لم يتم مسح أي بيانات.');
            }
        }

        $this->warn('🚀 البدء في عملية التنظيف الشامل للنظام (Deep Purge)...');

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // 1. مسح سجلات التواصل والذكاء الاصطناعي (AI & WhatsApp Logs)
            $this->info('🧹 مسح سجلات محادثات الواتساب والـ AI...');
            DB::table('messages')->truncate(); // سجلات الرسائل
            DB::table('notifications')->truncate(); // سجلات التنبيهات المرسلة
            if (DB::getSchemaBuilder()->hasTable('ai_interactions')) {
                DB::table('ai_interactions')->truncate(); 
            }

            // 2. مسح العمليات والبيانات الحركية
            $this->info('🧹 مسح الحجوزات، المبيعات، والطلبات...');
            DB::table('bookings')->truncate();
            DB::table('payments')->truncate();
            DB::table('subscriptions')->truncate();
            DB::table('crm_orders')->truncate();
            DB::table('crm_order_items')->truncate();
            DB::table('support_tickets')->truncate();
            DB::table('events')->truncate();

            // 3. مسح العملاء والمهتمين (CRM & Leads)
            $this->info('🧹 مسح بيانات العملاء (Leads & CRM Clients)...');
            Lead::truncate();
            DB::table('crm_clients')->truncate();
            DB::table('crm_opportunities')->truncate();

            // 4. مسح الموظفين (Staff)
            DB::table('staff')->truncate();

            // 5. مسح المستخدمين (بإستثناء الأدمن الرئيسي)
            $this->info('👤 تنظيف حسابات المستخدمين...');
            User::where('email', '!=', 'admin@o2oeg.com')
                ->where(function($q) use ($adminTenantId) {
                    $q->where('tenant_id', '!=', $adminTenantId)->orWhereNull('tenant_id');
                })->delete();

            // 6. مسح الصالونات والشركات (Tenants)
            $this->info('🏢 مسح حسابات الشركات والصالونات...');
            Tenant::where('id', '!=', $adminTenantId)->delete();

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->success_message();
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            $this->error('❌ فشلت العملية: ' . $e->getMessage());
        }
    }

    private function success_message()
    {
        $this->line('');
        $this->info('✅ تم تنظيف النظام بالكامل. سجلات الـ AI والواتساب أصبحت فارغة الآن.');
    }
}