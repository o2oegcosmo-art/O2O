/**
 * ====================================================
 * LOAD TESTING SCRIPT - O2OEG Platform
 * اختبار الحمل والضغط - محاكاة المستخدمين المتزامنين
 * ====================================================
 */

import http from 'http';
import { performance } from 'perf_hooks';
import fs from 'fs';

const BASE_URL = 'http://localhost:8000';
const TOTAL_REQUESTS = 50;
const CONCURRENT_BATCH = 10;

const results = { passed: 0, failed: 0, responseTimes: [], scenarios: [] };

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve) => {
        const start = performance.now();
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port || 8000,
            path: url.pathname,
            method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            timeout: 10000
        };
        if (data) {
            const body = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const duration = Math.round(performance.now() - start);
                resolve({ status: res.statusCode, duration, success: res.statusCode < 500, path });
            });
        });
        req.on('timeout', () => { req.destroy(); resolve({ status: 0, duration: 10000, success: false, path, error: 'TIMEOUT' }); });
        req.on('error', (err) => { resolve({ status: 0, duration: Math.round(performance.now() - start), success: false, path, error: err.message }); });
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runBatch(requests) {
    return Promise.all(requests.map(r => makeRequest(r.path, r.method, r.data)));
}

async function runLoadTest() {
    console.log('\n🚀 بدء اختبار الحمل والضغط - منصة O2OEG');
    console.log('='.repeat(55));
    console.log(`📡 الخادم: ${BASE_URL}`);
    console.log(`🔄 إجمالي الطلبات لكل سيناريو: ${TOTAL_REQUESTS}`);
    console.log(`⚡ طلبات متزامنة في الدفعة: ${CONCURRENT_BATCH}`);
    console.log('='.repeat(55));

    const scenarios = [
        { name: 'LOAD-001: API Root Check',       path: '/api/health',            method: 'GET',  expected: [200, 404] },
        { name: 'LOAD-002: Login Endpoint Stress', path: '/api/login',             method: 'POST', data: { phone: '01044167626', password: 'wrong' }, expected: [401, 422] },
        { name: 'LOAD-003: Leads Listing',         path: '/api/leads',             method: 'GET',  expected: [200, 401, 403] },
        { name: 'LOAD-004: CSRF Cookie',           path: '/sanctum/csrf-cookie',   method: 'GET',  expected: [204, 200, 404] },
        { name: 'LOAD-005: Admin Tenants',         path: '/api/admin/tenants',     method: 'GET',  expected: [200, 401] },
    ];

    const overallStart = performance.now();

    for (const scenario of scenarios) {
        const scenarioStart = performance.now();
        const batchResults = [];
        console.log(`\n🧪 ${scenario.name}  [${scenario.method} ${scenario.path}]`);

        const batchCount = Math.ceil(TOTAL_REQUESTS / CONCURRENT_BATCH);
        for (let b = 0; b < batchCount; b++) {
            const batchSize = Math.min(CONCURRENT_BATCH, TOTAL_REQUESTS - b * CONCURRENT_BATCH);
            const batch = Array(batchSize).fill(null).map(() => ({ path: scenario.path, method: scenario.method, data: scenario.data }));
            batchResults.push(...await runBatch(batch));
        }

        const totalTime  = Math.round(performance.now() - scenarioStart);
        const passed     = batchResults.filter(r => scenario.expected.includes(r.status) || r.success).length;
        const failed     = batchResults.length - passed;
        const times      = batchResults.map(r => r.duration);
        const avgTime    = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const maxTime    = Math.max(...times);
        const minTime    = Math.min(...times);
        const successRate = Math.round((passed / batchResults.length) * 100);

        console.log(`   ✅ نجح: ${passed}/${batchResults.length} (${successRate}%)`);
        console.log(`   ⏱️  متوسط زمن الاستجابة: ${avgTime}ms | أسرع: ${minTime}ms | أبطأ: ${maxTime}ms`);
        console.log(`   ⏰ وقت السيناريو الإجمالي: ${totalTime}ms`);

        results.scenarios.push({ name: scenario.name, path: scenario.path, method: scenario.method, total: batchResults.length, passed, failed, successRate, avgTime, minTime, maxTime, totalTime, status: successRate >= 70 ? 'PASS' : 'FAIL' });
        results.passed += passed;
        results.failed += failed;
        results.responseTimes.push(...times);
    }

    const totalDuration   = Math.round(performance.now() - overallStart);
    const totalRequests   = results.passed + results.failed;
    const overallSuccess  = Math.round((results.passed / totalRequests) * 100);
    const avgResponse     = Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length);
    const maxResponse     = Math.max(...results.responseTimes);
    const throughput      = Math.round(totalRequests / (totalDuration / 1000));

    console.log('\n\n' + '='.repeat(55));
    console.log('📊 التقرير النهائي - اختبار الحمل والضغط');
    console.log('='.repeat(55));
    console.log(`📦 إجمالي الطلبات:         ${totalRequests}`);
    console.log(`✅ نجح:                   ${results.passed}   ❌ فشل: ${results.failed}`);
    console.log(`🎯 نسبة النجاح:            ${overallSuccess}%`);
    console.log(`⏱️  متوسط زمن الاستجابة:  ${avgResponse}ms`);
    console.log(`📈 أبطأ استجابة:          ${maxResponse}ms`);
    console.log(`⏰ إجمالي وقت الاختبار:   ${Math.round(totalDuration/1000)}s`);
    console.log(`🚀 معدل الإنتاجية:        ${throughput} طلب/ثانية`);
    console.log('='.repeat(55));

    const report = {
        timestamp: new Date().toISOString(),
        server: BASE_URL,
        summary: { totalRequests, passed: results.passed, failed: results.failed, successRate: overallSuccess, avgResponseTime: avgResponse, maxResponseTime: maxResponse, totalDurationMs: totalDuration, throughput },
        scenarios: results.scenarios
    };

    fs.writeFileSync('./load_test_results.json', JSON.stringify(report, null, 2), 'utf8');
    console.log('\n💾 النتائج محفوظة في: load_test_results.json\n');
    return report;
}

runLoadTest().catch(err => { console.error('خطأ في اختبار الحمل:', err.message); process.exit(1); });
