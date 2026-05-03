<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Service;
use App\Models\Product;
use App\Models\Booking;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
{
    /**
     * الحصول على بيانات الصالون العامة (الخدمات، المنتجات، المواعيد)
     */
    public function getSalonProfile($id)
    {
        $tenant = Tenant::findOrFail($id);
        
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
        $tenant = Tenant::findOrFail($id);

        if ($tenant->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'الحجز غير متاح حالياً لهذا الصالون.'], 403);
        }

        $data = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'service_id' => 'required|exists:services,id',
            'booking_date' => 'required|date|after:today',
            'notes' => 'nullable|string'
        ]);

        // 1. البحث عن أو إنشاء العميل لهذا التينانت
        $customer = Customer::firstOrCreate(
            ['tenant_id' => $tenant->id, 'phone' => $data['customer_phone']],
            ['name' => $data['customer_name']]
        );

        // 2. إنشاء الحجز
        $booking = Booking::create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'service_id' => $data['service_id'],
            'booking_date' => $data['booking_date'],
            'status' => 'pending',
            'notes' => $data['notes']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم استلام طلب الحجز بنجاح، سيقوم الصالون بالتأكيد معك.',
            'booking' => $booking
        ]);
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

        // استخدام Gemini أو أي محرك متاح
        $apiKey = config('services.google_ai.api_key') ?: env('GEMINI_API_KEY');
        
        try {
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey, [
                    'contents' => [['parts' => [['text' => $prompt]]]]
                ]);

            if ($response->successful()) {
                $text = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? 'أهلاً بك يا فندم! كيف يمكنني مساعدتك؟';
                return response()->json(['success' => true, 'response' => $text]);
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'AI logic failure'], 500);
        }

        return response()->json(['success' => true, 'response' => 'أهلاً بك يا فندم! نعتذر، المحرك مشغول حالياً، هل يمكنني مساعدتك في شيء آخر؟']);
    }
}

