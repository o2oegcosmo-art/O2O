import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' }
});

// إضافة "Interceptor" لحقن التوكن تلقائياً في كل طلب
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('o2oeg_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// إضافة معالج للأخطاء (Interceptor) للتعامل مع حظر الهجمات (Rate Limiting)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 429) {
            // تخصيص رسالة الخطأ عند تجاوز المحاولات المسموح بها
            error.message = "محاولات كثيرة جداً! تم حظرك مؤقتاً لحماية النظام. يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.";
        }
        return Promise.reject(error);
    }
);

export default api;