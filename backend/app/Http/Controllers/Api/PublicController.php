<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Service;
use App\Models\Product;
use App\Models\Booking;
use App\Models\Customer;
use App\Services\AIRouterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class PublicController extends Controller
{
    protected $aiRouter;

    public function __construct(AIRouterService $aiRouter)
    {
        $this->aiRouter = $aiRouter;
    }

    /**
     * الحصول على بيانات الصالون العامة (الخدمات، المنتجات، المواعيد)
     */
    public function getSalonProfile($id)
    {
        $tenant = Tenant::findOrFail($id);
        return $this->processSalonProfile($tenant);
    }

    /**
     * الحصول على بيانات الصالون العامة باستخدام الدومين/الاسم الفريد
     */
    public function getSalonProfileByDomain($domain)
    {
        // البحث عن الصالون بالدومين الكامل، الاسم الفريد، أو الدومين المخصص لكبار العملاء
        $tenant = Tenant::where('domain', $domain)
                        ->orWhere('domain', $domain . '.o2oeg.com')
                        ->orWhere('custom_domain', $domain)
                        ->orWhere('custom_domain', 'www.' . $domain)
                        ->orWhere('custom_domain', str_replace('www.', '', $domain))
                        ->first();
        
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، هذا الرابط غير صحيح أو الصالون غير مسجل.'
            ], 404);
        }

        return $this->processSalonProfile($tenant);
    }

    /**
     * معالجة بيانات الملف الشخصي للصالون
     */
    private function processSalonProfile(Tenant $tenant)
    {
        if ($tenant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، هذا الصالون غير متاح حالياً.'
            ], 403);
        }
        
        $services = Service::where('tenant_id', $tenant->id)->get();
        $products = Product::where('tenant_id', $tenant->id)->where('stock_quantity', '>', 0)->get();
        
        return response()->json([
            'success' => true,
            'salon' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'description' => $tenant->description,
                'address' => $tenant->address,
                'logo_url' => $tenant->logo_url,
                'business_category' => $tenant->business_category,
                'domain' => $tenant->domain,
            ],
            'services' => $services,
            'products' => $products
        ]);
    }

    /**
     * حجز خدمة عامة من قبل عميل
     */
    public function publicBook(Request $request, $id)
    {
        // البحث عن الصالون بالمعرف (ID) أو بالدومين لضمان المرونة الكاملة
        $tenant = Tenant::where('id', $id)->orWhere('domain', $id)->firstOrFail();

        if ($tenant->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'الحجز غير متاح حالياً لهذا الصالون.'], 403);
        }

        $data = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'service_id' => 'required|exists:services,id',
            'booking_date' => 'required', // Removed strict date validation to prevent 1st time failure
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function() use ($tenant, $data) {
            // 1. البحث عن أو إنشاء العميل لهذا التينانت
            $customer = Customer::firstOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $data['customer_phone']],
                ['name' => $data['customer_name']]
            );

            // جلب سعر الخدمة لضمان دقة البيانات المالية
            $service = Service::findOrFail($data['service_id']);

            // 2. إنشاء الحجز
            $booking = Booking::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'service_id' => $data['service_id'],
                'appointment_at' => $data['booking_date'],
                'status' => 'pending',
                'price' => $service->price,
                'notes' => $data['notes']
            ]);

            return $booking;
        });

        return response()->json([
            'success' => true,
            'message' => 'تم استلام طلب الحجز بنجاح!',
            'booking_id' => $booking->id
        ], 201);
    }

    /**
     * طلب منتج من المتجر الإلكتروني للصالون
     */
    public function publicOrder(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        if ($tenant->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'الشراء غير متاح حالياً من هذا المتجر.'], 403);
        }

        $data = $request->validate([
            'customer_name'           => 'required|string',
            'customer_phone'          => 'required|string',
            'items'                   => 'required|array|min:1',
            'items.*.product_id'      => 'required|exists:products,id',
            'items.*.quantity'        => 'required|integer|min:1',
            'address'                 => 'required|string',
            'notes'                   => 'nullable|string',
        ]);

        $totalAmount = 0;
        $orderItems  = [];

        foreach ($data['items'] as $item) {
            $product = \App\Models\Product::where('tenant_id', $tenant->id)
                ->where('id', $item['product_id'])
                ->where('stock_quantity', '>=', $item['quantity'])
                ->firstOrFail();

            $subtotal      = $product->retail_price * $item['quantity'];
            $totalAmount  += $subtotal;
            $orderItems[]  = [
                'product'      => $product,
                'product_name' => $product->name,
                'unit_price'   => $product->retail_price,
                'quantity'     => $item['quantity'],
                'subtotal'     => $subtotal,
            ];
        }

        return DB::transaction(function () use ($tenant, $data, $totalAmount, $orderItems) {
            // إنشاء الطلب الرئيسي
            $order = \App\Models\RetailOrder::create([
                'tenant_id'        => $tenant->id,
                'order_number'     => \App\Models\RetailOrder::generateOrderNumber($tenant->id),
                'customer_name'    => $data['customer_name'],
                'customer_phone'   => $data['customer_phone'],
                'customer_address' => $data['address'],
                'total_amount'     => $totalAmount,
                'status'           => 'pending',
                'notes'            => $data['notes'] ?? null,
            ]);

            // إنشاء بنود الطلب وتحديث المخزون
            foreach ($orderItems as $item) {
                \App\Models\RetailOrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $item['product']->id,
                    'product_name' => $item['product_name'],
                    'unit_price'   => $item['unit_price'],
                    'quantity'     => $item['quantity'],
                    'subtotal'     => $item['subtotal'],
                ]);

                // خصم من المخزون
                $item['product']->decrement('stock_quantity', $item['quantity']);
            }

            return response()->json([
                'success'      => true,
                'message'      => "تم استلام طلبك بنجاح! رقم طلبك هو: {$order->order_number}. سيقوم فريقنا بالتواصل معك خلال 24 ساعة.",
                'order_number' => $order->order_number,
            ], 201);
        });
    }

    /**
     * استشارة الذكاء الاصطناعي لزوار الصالون
     */
    public function aiConsult(Request $request)
    {
        $data = $request->validate([
            'query' => 'required|string',
            'context' => 'required|array',
            'context.salon_id' => 'required|exists:tenants,id'
        ]);

        $tenant = Tenant::findOrFail($data['context']['salon_id']);
        $services = Service::where('tenant_id', $tenant->id)->get();
        $servicesList = $services->map(fn($s) => "- {$s->name} ({$s->price} ج.م)")->implode("\n");

        $prompt = "أنت مساعد ذكي لصالون '{$tenant->name}'. 
مهمتك هي مساعدة الزوار والرد على استفساراتهم بلباقة وود.
الخدمات المتاحة لدينا هي:
{$servicesList}

العنوان: {$tenant->address}

التعليمات:
- استخدم اللهجة المصرية المهذبة (يا فندم).
- كن مختصراً وودوداً.
- إذا سأل العميل عن حجز، وجهه للضغط على زر 'احجز الآن'.

رسالة العميل: {$data['query']}";

        $response = $this->aiRouter->route($prompt, $tenant, 'public_chat', false);

        if ($response['success']) {
            return response()->json([
                'success' => true, 
                'response' => $response['data'],
                'provider' => $response['provider']
            ]);
        }

        return response()->json([
            'success' => true, 
            'response' => 'أهلاً بك يا فندم! نعتذر، المحرك مشغول حالياً، هل يمكنني مساعدتك في شيء آخر؟'
        ]);
    }

    /**
     * وظيفة مركزية لتقديم واجهة المستخدم مع دعم الـ SEO
     */
    public function renderFrontend($meta = null)
    {
        $paths = [
            '/var/www/o2oeg/backend/public/index.html',
            public_path('index.html'),
            base_path('../public/index.html'),
            base_path('public/index.html'),
            '/home/u525164227/O2O/backend/public/index.html',
            '/var/www/u525164227/backend/public/index.html',
        ];

        $html = "System is updating... Please refresh in 1 minute.";
        foreach ($paths as $path) {
            if (File::exists($path)) {
                $html = File::get($path);
                break;
            }
        }

        if ($meta && is_array($meta)) {
            // استبدال العناوين
            $html = str_replace(
                ['O2OEG - منصة الصالونات الذكية', 'O2OEG - منصة إدارة الصالونات الذكية'],
                ($meta['title'] ?? 'O2OEG') . " | O2OEG",
                $html
            );
            // استبدال الوصف
            if (isset($meta['description'])) {
                $html = str_replace(
                    'نظام متكامل لإدارة صالونات التجميل، الحجز الذكي، ومنظومة الكاشير.',
                    $meta['description'],
                    $html
                );
            }
            // استبدال الصورة
            if (isset($meta['image'])) {
                $html = str_replace(
                    'content="https://o2oeg.com/og-image.jpg"',
                    'content="' . $meta['image'] . '"',
                    $html
                );
            }
            // استبدال الرابط
            if (isset($meta['url'])) {
                $html = str_replace(
                    'content="https://o2oeg.com"',
                    'content="' . $meta['url'] . '"',
                    $html
                );
            }
        }

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    /**
     * صفحة الصالون العامة (دعم كامل للـ SEO)
     */
    public function showSalonPublicPage($id)
    {
        $tenant = Tenant::where('id', $id)->orWhere('domain', $id)->first();
        
        if (!$tenant) {
            return $this->renderFrontend();
        }

        $meta = [
            'title' => $tenant->name,
            'description' => $tenant->description ?? "احجز موعدك الآن في " . $tenant->name . " عبر منصة O2OEG واستمتع بأفضل تجربة جمال ذكية.",
            'image' => $tenant->og_image_url ?? ($tenant->logo_url ?? "https://o2oeg.com/default-salon.png"),
            'url' => url()->current(),
        ];

        return $this->renderFrontend($meta);
    }
}

