# موديول توليد الفيديوهات التسويقية (O2OEG Remotion Module)

هذا الموديول مسؤول عن توليد فيديوهات تسويقية ديناميكية للصالونات المشتركة في منصة O2OEG باستخدام تقنية **Remotion** (React for Video).

## 📂 هيكلية الملفات

- `src/remotion/MyVideo.tsx`: المكون الأساسي للفيديو (التصميم، التحريكات، والموسيقى).
- `src/remotion/Root.tsx`: ملف التسجيل الأساسي (Entry Point) حيث يتم تحديد أبعاد الفيديو ومعدل الإطارات.
- `src/pages/VideoManager.tsx`: واجهة التحكم التي تسمح لصاحب الصالون بمعاينة الفيديو وتغيير البيانات لحظياً.

## 🚀 الميزات التقنية

1. **Ken Burns Effect**: تحريك تدريجي للصور يعطي طابعاً سينمائياً.
2. **Spring Animations**: استخدام الفيزياء في التحريكات لضمان سلاسة دخول النصوص.
3. **Dynamic QR Code**: توليد كود حجز مخصص يظهر في نهاية الفيديو.
4. **Audio Integration**: دعم الموسيقى الخلفية المتزامنة.
5. **RTL Support**: دعم كامل للنصوص العربية وتنسيقاتها.

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

## 💡 ملاحظات للمطورين

- **الخطوط**: يفضل استخدام خطوط مثل `Cairo` أو `Almarai` من Google Fonts لضمان مظهر احترافي للنصوص العربية.
- **الأداء**: عند الرندرة على السيرفر، يفضل استخدام **AWS Lambda** أو **Background Jobs** في Laravel لأن عملية المعالجة تستهلك موارد المعالج (CPU).
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