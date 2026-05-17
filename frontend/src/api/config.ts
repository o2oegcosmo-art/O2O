import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// ✅ قائمة المسارات الجانبية التي لا يجب أن تُسبب تسجيل خروج عند 401
const NON_AUTH_PATHS = ['/bridge/', '/ai/will-ai', '/plans'];

// إضافة "Interceptor" لحقن التوكن تلقائياً في كل طلب
api.interceptors.request.use((config) => {
    // 🛡️ Multi-Session Strategy: Detect role-specific token key based on current URL path
    let tokenKey = 'o2oeg_token';
    const path = window.location.pathname;
    
    if (path.includes('/admin')) tokenKey = 'o2oeg_token_admin';
    else if (path.includes('/salon')) tokenKey = 'o2oeg_token_salon';
    else if (path.includes('/company')) tokenKey = 'o2oeg_token_company';
    else if (path.includes('/affiliate')) tokenKey = 'o2oeg_token_affiliate';

    // ✅ اقرأ التوكن الخاص بالدور (مع Fallback للعام في حالة الانتقال)
    const token = localStorage.getItem(tokenKey) || 
                  sessionStorage.getItem(tokenKey) ||
                  localStorage.getItem('o2oeg_token') ||
                  sessionStorage.getItem('o2oeg_token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// إضافة معالج للأخطاء (Interceptor) للتعامل مع حظر الهجمات (Rate Limiting)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 429) {
            error.message = "عذراً، محاولات كثيرة جداً. يرجى الانتظار دقيقة واحدة وسنكون جاهزين لخدمتك مرة أخرى.";
        }
        
        // 🛡️ إذا انتهت صلاحية التوكن، قم بتسجيل الخروج تلقائياً وإعادة التوجيه لصفحة الدخول
        if (error.response && error.response.status === 401) {
            const path = window.location.pathname;

            // ✅ تجاهل 401 من المسارات الجانبية (bridge, AI, plans)
            const requestUrl = originalRequest?.url || '';
            const isNonAuthPath = NON_AUTH_PATHS.some(p => requestUrl.includes(p));
            if (isNonAuthPath) {
                return Promise.reject(error);
            }

            let tokenKey = 'o2oeg_token';
            let userKey = 'o2oeg_user';

            if (path.includes('/admin')) { tokenKey = 'o2oeg_token_admin'; userKey = 'o2oeg_user_admin'; }
            else if (path.includes('/salon')) { tokenKey = 'o2oeg_token_salon'; userKey = 'o2oeg_user_salon'; }
            else if (path.includes('/company')) { tokenKey = 'o2oeg_token_company'; userKey = 'o2oeg_user_company'; }
            else if (path.includes('/affiliate')) { tokenKey = 'o2oeg_token_affiliate'; userKey = 'o2oeg_user_affiliate'; }

            const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey);
            
            // ✅ لا تسجل الخروج إلا إذا كان هناك توكن فعلي وفشل الطلب
            if (token && !originalRequest._retry) {
                originalRequest._retry = true;
                
                // 🛑 تنبيه: تم رصد محاولة دخول غير مصرح بها أو انتهاء جلسة
                console.error(`🔐 Auth Failure [${tokenKey}] at ${path}. Clearing session.`);
                
                // مسح كافة المفاتيح المحتملة لضمان نظافة الجلسة
                [tokenKey, userKey, 'o2oeg_token', 'o2oeg_user'].forEach(k => {
                    localStorage.removeItem(k);
                    sessionStorage.removeItem(k);
                });
                
                if (window.location.pathname !== '/login') {
                    window.location.replace('/login?expired=true');
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
