import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
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
            error.message = "عذراً، محاولات كثيرة جداً. يرجى الانتظار دقيقة واحدة وسنكون جاهزين لخدمتك مرة أخرى.";
        }
        // 🛡️ إذا انتهت صلاحية التوكن، قم بتسجيل الخروج تلقائياً وإعادة التوجيه لصفحة الدخول
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('o2oeg_token');
            localStorage.removeItem('o2oeg_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
