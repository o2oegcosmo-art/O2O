# موديول توليد الفيديوهات التسويقية (O2OEG Remotion Module)

هذا الموديول مسؤول عن توليد فيديوهات تسويقية ديناميكية للصالونات المشتركة في منصة O2OEG باستخدام تقنية **Remotion** (React for Video).

## 📂 هيكلية الملفات

- `src/remotion/MyVideo.tsx`: المكون الأساسي للفيديو (التصميم، التحريكات، والموسيقى).
- `src/remotion/Root.tsx`: ملف التسجيل الأساسي (Entry Point) حيث يتم تحديد أبعاد الفيديو ومعدل الإطارات.
- `src/pages/VideoManager.tsx`: واجهة التحكم التي تسمح لصاحب الصالون بمعاينة الفيديو وتغيير البيانات لحظياً.

## 🚀 الميزات التقنية

1. **Client-Side Rendering (WebGPU)**: إمكانية توليد الفيديو مباشرة في متصفح المستخدم لتوفير موارد السيرفر.
2. **Ken Burns Effect**: تحريك تدريجي للصور يعطي طابعاً سينمائياً.
3. **Spring Animations**: استخدام الفيزياء في التحريكات لضمان سلاسة دخول النصوص.
4. **Dynamic QR Code**: توليد كود حجز مخصص يظهر في نهاية الفيديو.
5. **Audio Integration**: دعم الموسيقى خلفية المتزامنة.
6. **RTL Support**: دعم كامل النصوص العربية وتنسيقاتها.

## 🛠 كيفية الاستخدام

### 1. تشغيل بيئة التطوير والمعاينة
لمعاينة التغييرات على التصميم في متصفح منفصل:
```bash
npx remotion preview src/remotion/Root.tsx
```

### 2. المكونات الأساسية (API)

يستقبل موديول `MyVideo` الخصائص (Props) التالية:

| الخاصية | النوع | الوصف |
| :--- | :--- | :--- |
| `salonName` | `string` | اسم الصالون الذي سيظهر في الإعلان. |
| `serviceName` | `string` | اسم الخدمة المقدمة (مثل: قص شعر). |
| `price` | `string` | السعر المعروض في الفيديو. |
| `imageUrl` | `string` | رابط صورة الخلفية للخدمة. |
| `qrCodeUrl` | `string` | (اختياري) رابط صورة الـ QR Code للحجز المباشر. |

### 3. الرندرة (Render) برمجياً
لتحويل الكود إلى ملف MP4 عبر سطر الأوامر:
```bash
npx remotion render src/remotion/Root.tsx SalonIntro out/video.mp4 --props='{"salonName": "O2O Beauty", "price": "200"}'
```

##  استراتيجيات الرندرة (Rendering Strategies)

### 1. الرندرة عند المستخدم (Edge/Client-Side) - *موصى به*
يتم استخدام `WebCodecs` و `WebGPU` لتوليد الفيديو داخل المتصفح. هذا الخيار يوفر استهلاك الـ CPU على سيرفر هوستنجر بنسبة 100%.

#### كيفية التنفيذ البرمجي:
1. **Capture**: يتم استخدام `delayRender` و `useVideoConfig` داخل Remotion لضمان جاهزية الإطار.
2. **Encode**: استخدام الـ `VideoEncoder API` المتوفر في المتصفحات الحديثة (Chrome 94+).
3. **Muxing**: استخدام مكتبة `mp4-muxer` لتجميع الـ Chunks الناتجة في ملف MP4.

**مثال لتهيئة المشفر:**
```typescript
const encoder = new VideoEncoder({
  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  error: (e) => console.error(e)
});
```

### 2. الرندرة على السيرفر (Server-Side)
تُستخدم فقط في حال الحاجة لتوليد فيديوهات في الخلفية (Background Tasks).

 - **الأداء**: عند الرندرة على السيرفر، يفضل استخدام **Background Jobs** في Laravel مع مراعاة أن السيرفر الحالي (4 CPU) قد يتأثر عند تعدد العمليات.
- **الموسيقى**: تأكد من أن ملفات الصوت موجودة في مجلد `public` أو يتم استدعاؤها من روابط مباشرة (Direct URLs).

## 🔄 التكامل مع Laravel (Backend)
يمكن استدعاء هذا الموديول من الباك-إند لتوليد فيديوهات تلقائية عند إضافة خدمة جديدة:

```php
// مثال في Laravel Controller
public function generateVideo(Service $service) {
    $data = json_encode([...]);
    Process::run("node render-video.mjs '{$data}'");
}
```

---
تم إنشاء هذا التوثيق بواسطة **Gemini Code Assist** لمشروع O2OEG.