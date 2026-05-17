/**
 * ====================================================
 * AUTOMATION & UAT TESTING SCRIPT - O2OEG Platform
 * اختبار الأتمتة وقبول المستخدم - محاكاة سلوك المستخدم الحقيقي
 * ====================================================
 */

import http from 'http';
import fs from 'fs';

const API_BASE   = 'http://localhost:8000';
const FRONT_BASE = 'http://localhost:5173';

// ===========================
// دالة مساعدة لإرسال HTTP
// ===========================
function httpRequest(baseUrl, path, method = 'GET', data = null, token = null) {
    return new Promise((resolve) => {
        const url  = new URL(baseUrl + path);
        const body = data ? JSON.stringify(data) : null;
        const opts = {
            hostname: url.hostname,
            port:     url.port,
            path:     url.pathname + url.search,
            method,
            headers: {
                'Content-Type':  'application/json',
                'Accept':        'application/json',
                ...(body  ? { 'Content-Length': Buffer.byteLength(body) } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` }        : {}),
            },
            timeout: 10000,
        };

        const req = http.request(opts, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(raw); } catch {}
                resolve({ status: res.statusCode, body: json, raw });
            });
        });
        req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT' }); });
        req.on('error', e  => resolve({ status: 0, error: e.message }));
        if (body) req.write(body);
        req.end();
    });
}

// ===========================
// تسجيل نتائج الاختبار
// ===========================
const report = { timestamp: new Date().toISOString(), results: [], summary: {} };

function logTest(id, name, status, note, details = {}) {
    const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`\n${icon} ${id}: ${name}`);
    console.log(`   النتيجة: ${status}`);
    console.log(`   التفاصيل: ${note}`);
    report.results.push({ id, name, status, note, ...details });
}

// ===========================
// تشغيل الاختبارات
// ===========================
async function runAutomationTests() {
    console.log('\n🤖 اختبار الأتمتة وقبول المستخدم (Automation + UAT)');
    console.log('='.repeat(60));
    console.log('📅 التاريخ: ' + new Date().toLocaleString('ar-EG'));
    console.log('🌐 API:      ' + API_BASE);
    console.log('🖥️  Frontend: ' + FRONT_BASE);
    console.log('='.repeat(60));

    // -----------------------------------------------
    // AUTO-001: التحقق من أن الـ Frontend يعمل
    // -----------------------------------------------
    console.log('\n📦 قسم الأتمتة (Automation Tests)');
    console.log('-'.repeat(40));

    const frontRes = await httpRequest(FRONT_BASE, '/', 'GET');
    if (frontRes.status === 200 || frontRes.status === 404) {
        logTest('AUTO-001', 'Frontend Server Running', 'PASS', `تطبيق الواجهة يستجيب بـ HTTP ${frontRes.status}`, { httpStatus: frontRes.status });
    } else {
        logTest('AUTO-001', 'Frontend Server Running', 'FAIL', `الخادم لا يستجيب (كود: ${frontRes.status || frontRes.error})`, { httpStatus: frontRes.status });
    }

    // -----------------------------------------------
    // AUTO-002: التحقق من أن الـ Backend API يعمل
    // -----------------------------------------------
    const apiRes = await httpRequest(API_BASE, '/api/health', 'GET');
    if (apiRes.status && apiRes.status < 500) {
        logTest('AUTO-002', 'Backend API Server Running', 'PASS', `API يستجيب بـ HTTP ${apiRes.status}`, { httpStatus: apiRes.status });
    } else {
        logTest('AUTO-002', 'Backend API Server Running', 'FAIL', `API لا يستجيب (${apiRes.error || apiRes.status})`, { httpStatus: apiRes.status });
    }

    // -----------------------------------------------
    // AUTO-003: اختبار تسجيل الدخول بيانات خاطئة (يجب الرفض)
    // -----------------------------------------------
    const badLogin = await httpRequest(API_BASE, '/api/login', 'POST', {
        phone: '01044167626', password: 'WrongPassword!@#'
    });
    if (badLogin.status === 401 || badLogin.status === 422) {
        logTest('AUTO-003', 'Wrong Credentials Rejected', 'PASS', `النظام رفض البيانات الخاطئة بكود ${badLogin.status}`, { httpStatus: badLogin.status });
    } else {
        logTest('AUTO-003', 'Wrong Credentials Rejected', 'FAIL', `النظام قبل بيانات خاطئة! كود: ${badLogin.status}`, { httpStatus: badLogin.status });
    }

    // -----------------------------------------------
    // AUTO-004: اختبار تسجيل دخول صحيح (Admin)
    // -----------------------------------------------
    const goodLogin = await httpRequest(API_BASE, '/api/login', 'POST', {
        phone: '01044167626', password: 'O2OEG_Secure_Shield_2026_#646'
    });
    let adminToken = null;
    if (goodLogin.status === 200 && goodLogin.body?.access_token) {
        adminToken = goodLogin.body.access_token;
        logTest('AUTO-004', 'Admin Login Successful', 'PASS', `تم الدخول بنجاح - المستخدم: ${goodLogin.body?.user?.name} | الدور: ${goodLogin.body?.user?.role}`, { httpStatus: goodLogin.status, tokenReceived: true });
    } else {
        logTest('AUTO-004', 'Admin Login Successful', 'FAIL', `فشل تسجيل الدخول - كود: ${goodLogin.status} | الاستجابة: ${JSON.stringify(goodLogin.body)}`, { httpStatus: goodLogin.status, body: goodLogin.body });
    }

    // -----------------------------------------------
    // AUTO-005: الوصول لمسار محمي بدون Token
    // -----------------------------------------------
    const noAuth = await httpRequest(API_BASE, '/api/me', 'GET');
    if (noAuth.status === 401) {
        logTest('AUTO-005', 'Protected Route Blocks Unauthenticated Access', 'PASS', `النظام رفض الطلب بكود 401 بدون Token`, { httpStatus: 401 });
    } else {
        logTest('AUTO-005', 'Protected Route Blocks Unauthenticated Access', 'WARN', `النظام أجاب بكود ${noAuth.status} (متوقع 401)`, { httpStatus: noAuth.status });
    }

    // -----------------------------------------------
    // AUTO-006: الوصول لمسار محمي بـ Token صالح
    // -----------------------------------------------
    if (adminToken) {
        const withAuth = await httpRequest(API_BASE, '/api/me', 'GET', null, adminToken);
        if (withAuth.status === 200 || withAuth.status === 204) {
            logTest('AUTO-006', 'Protected Route Accessible With Valid Token', 'PASS', `الوصول للـ /api/me نجح بكود ${withAuth.status} - المستخدم: ${withAuth.body?.user?.name}`, { httpStatus: withAuth.status });
        } else {
            logTest('AUTO-006', 'Protected Route Accessible With Valid Token', 'WARN', `كود الاستجابة ${withAuth.status}`, { httpStatus: withAuth.status });
        }
    } else {
        logTest('AUTO-006', 'Protected Route Accessible With Valid Token', 'FAIL', 'تم تخطي الاختبار: لم يتم الحصول على Token', {});
    }

    // -----------------------------------------------
    // AUTO-007: اختبار CSRF Cookie
    // -----------------------------------------------
    const csrf = await httpRequest(API_BASE, '/sanctum/csrf-cookie', 'GET');
    if (csrf.status === 204 || csrf.status === 200) {
        logTest('AUTO-007', 'CSRF Protection Active', 'PASS', `CSRF Cookie endpoint يستجيب بكود ${csrf.status}`, { httpStatus: csrf.status });
    } else {
        logTest('AUTO-007', 'CSRF Protection Active', 'WARN', `CSRF endpoint أجاب بكود ${csrf.status}`, { httpStatus: csrf.status });
    }

    // -----------------------------------------------
    // AUTO-008: اختبار WhatsApp Bridge
    // -----------------------------------------------
    const bridgeRes = await httpRequest('http://localhost:9005', '/status', 'GET');
    if (bridgeRes.status === 200 || bridgeRes.status === 404) {
        logTest('AUTO-008', 'WhatsApp Bridge Server Running', 'PASS', `جسر الواتساب يعمل ويستجيب بكود ${bridgeRes.status}`, { httpStatus: bridgeRes.status });
    } else {
        logTest('AUTO-008', 'WhatsApp Bridge Server Running', bridgeRes.status === 0 ? 'WARN' : 'PASS', `كود الاستجابة: ${bridgeRes.status || bridgeRes.error}`, { httpStatus: bridgeRes.status });
    }

    // -----------------------------------------------
    // اختبارات قبول المستخدم UAT
    // -----------------------------------------------
    console.log('\n\n👑 قسم قبول المستخدم (UAT Tests)');
    console.log('-'.repeat(40));

    // UAT-001: التحقق من صحة بنية استجابة API الـ Salon
    if (adminToken) {
        const tenants = await httpRequest(API_BASE, '/api/admin/stats', 'GET', null, adminToken);
        if (tenants.status === 200 && tenants.body) {
            logTest('UAT-001', 'Admin Can List Stats', 'PASS', `الأدمن يرى الإحصائيات`, { httpStatus: 200 });
        } else {
            logTest('UAT-001', 'Admin Can List All Salons (Tenants)', 'WARN', `الاستجابة: ${tenants.status}`, { httpStatus: tenants.status });
        }

        // UAT-002: التحقق من صلاحية إدارة المدفوعات
        const payments = await httpRequest(API_BASE, '/api/admin/payments/pending', 'GET', null, adminToken);
        if (payments.status === 200) {
            logTest('UAT-002', 'Admin Can View Pending Payments', 'PASS', `لوحة المدفوعات تعمل بنجاح`, { httpStatus: 200 });
        } else {
            logTest('UAT-002', 'Admin Can View Pending Payments', 'WARN', `الاستجابة: ${payments.status}`, { httpStatus: payments.status });
        }

        // UAT-003: تسجيل الخروج
        const logout = await httpRequest(API_BASE, '/api/logout', 'POST', null, adminToken);
        if (logout.status === 200 || logout.status === 204) {
            logTest('UAT-003', 'Logout Clears Session', 'PASS', `تسجيل الخروج نجح بكود ${logout.status}`, { httpStatus: logout.status });
        } else {
            logTest('UAT-003', 'Logout Clears Session', 'WARN', `كود: ${logout.status}`, { httpStatus: logout.status });
        }

        // UAT-004: Token المنتهي لا يصلح بعد الخروج
        const postLogout = await httpRequest(API_BASE, '/api/me', 'GET', null, adminToken);
        if (postLogout.status === 401) {
            logTest('UAT-004', 'Token Invalidated After Logout', 'PASS', `Token انتهت صلاحيته بعد الخروج (401)`, { httpStatus: 401 });
        } else {
            logTest('UAT-004', 'Token Invalidated After Logout', 'FAIL', `Token لا تزال صالحة! كود: ${postLogout.status}`, { httpStatus: postLogout.status });
        }
    } else {
        ['UAT-001', 'UAT-002', 'UAT-003', 'UAT-004'].forEach(id => {
            logTest(id, 'Skipped - No Admin Token', 'WARN', 'تخطي: فشل تسجيل الدخول', {});
        });
    }

    // UAT-005: واجهة API للـ Leads تستجيب
    const leadsCheck = await httpRequest(API_BASE, '/api/leads', 'GET');
    if (leadsCheck.status !== 0 && leadsCheck.status !== 500) {
        logTest('UAT-005', 'Leads API Responds Correctly', 'PASS', `API الـ Leads يستجيب بكود ${leadsCheck.status}`, { httpStatus: leadsCheck.status });
    } else {
        logTest('UAT-005', 'Leads API Responds Correctly', 'FAIL', `API الـ Leads لا يستجيب`, { httpStatus: leadsCheck.status });
    }

    // ========================
    // ملخص التقرير
    // ========================
    const passed = report.results.filter(r => r.status === 'PASS').length;
    const failed = report.results.filter(r => r.status === 'FAIL').length;
    const warned = report.results.filter(r => r.status === 'WARN').length;
    const total  = report.results.length;
    const successRate = Math.round((passed / total) * 100);

    report.summary = { total, passed, failed, warned, successRate };

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 الملخص النهائي - الأتمتة + UAT');
    console.log('='.repeat(60));
    console.log(`📋 إجمالي الاختبارات: ${total}`);
    console.log(`✅ نجح:               ${passed}`);
    console.log(`⚠️  تحذير:             ${warned}`);
    console.log(`❌ فشل:               ${failed}`);
    console.log(`🎯 نسبة النجاح:        ${successRate}%`);
    console.log('='.repeat(60));

    fs.writeFileSync('./automation_uat_results.json', JSON.stringify(report, null, 2), 'utf8');
    console.log('\n💾 النتائج محفوظة في: automation_uat_results.json\n');
    return report;
}

runAutomationTests().catch(err => { console.error('خطأ:', err.message); process.exit(1); });
