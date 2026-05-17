<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * رفع صورة وحفظها في التخزين المحلي (Public)
     * يحفظ الصورة بمقاسها الأصلي دون تشويه
     */
    public function uploadImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:10240',
            ]);

            if (!$request->hasFile('image')) {
                return response()->json(['success' => false, 'message' => 'لم يتم إرسال أي صورة'], 400);
            }

            $file = $request->file('image');
            
            // التحقق من أن الملف مرفوع بنجاح
            if (!$file->isValid()) {
                return response()->json(['success' => false, 'message' => 'الملف تالف أو لم يكتمل الرفع'], 400);
            }

            // تحديد مجلد الحفظ بناءً على المستخدم
            $tenantId = $request->user()->tenant_id ?? 'public';
            $directory = "uploads/{$tenantId}";

            // إنشاء المجلد إذا لم يكن موجوداً
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            // توليد اسم فريد للملف مع الحفاظ على الامتداد الأصلي
            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = Str::random(20) . '_' . time() . '.' . $extension;

            // حفظ الصورة الأصلية مباشرة بدون معالجة (للحفاظ على المقاس الأصلي)
            $finalPath = $file->storeAs($directory, $filename, 'public');

            if (!$finalPath) {
                return response()->json(['success' => false, 'message' => 'فشل حفظ الصورة في التخزين'], 500);
            }

            // بناء الـ URL الصحيح
            $appUrl = rtrim(env('APP_URL', 'http://localhost:8000'), '/');
            $relativeUrl = '/storage/' . $finalPath;
            $absoluteUrl = $appUrl . $relativeUrl;

            \Log::info("Image uploaded successfully: {$finalPath} by tenant {$tenantId}");

            return response()->json([
                'success'      => true,
                'url'          => $relativeUrl,
                'absolute_url' => $absoluteUrl,
                'path'         => $finalPath,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في التحقق: ' . collect($e->errors())->flatten()->first()
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Image Upload Failed: " . $e->getMessage() . " | File: " . $e->getFile() . " | Line: " . $e->getLine());
            return response()->json([
                'success' => false,
                'message' => 'فشل رفع الصورة: ' . $e->getMessage()
            ], 500);
        }
    }
}

