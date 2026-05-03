const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const pino = require('pino');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// --- Configuration ---
const LARAVEL_WEBHOOK_URL = 'http://127.0.0.1:8000/api/webhooks/whatsapp';
const BRIDGE_API_KEY = 'o2oeg_bridge_secret_2026_z8v9';
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR);
}

// --- Multi-Session Store ---
const sessions = new Map();

/**
 * Helper: Get session auth path
 */
function getAuthPath(tenantId) {
    return path.join(SESSIONS_DIR, `session_${tenantId}`);
}

/**
 * Initialize a WhatsApp session for a specific tenant
 */
async function initSession(tenantId) {
    if (sessions.has(tenantId)) {
        console.log(`[${tenantId}] Session already exists.`);
        return sessions.get(tenantId);
    }

    console.log(`🚀 [${tenantId}] Initializing new session...`);
    const authPath = getAuthPath(tenantId);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false, // Don't spam terminal for multi-tenant
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["O2OEG AI Platform", "Chrome", "1.0.0"]
    });

    const sessionData = {
        sock,
        qr: null,
        isConnected: false,
        tenantId
    };

    sessions.set(tenantId, sessionData);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`[${tenantId}] New QR Code generated.`);
            sessionData.qr = qr;
            sessionData.isConnected = false;
        }

        if (connection === 'close') {
            sessionData.isConnected = false;
            sessionData.qr = null;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect =
                (lastDisconnect.error instanceof Boom)
                    ? statusCode !== DisconnectReason.loggedOut
                    : true;

            console.log(`[${tenantId}] Connection closed. Reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                // Remove from map to trigger full re-init on next request or auto-restart
                sessions.delete(tenantId);
                setTimeout(() => initSession(tenantId), 5000);
            } else {
                console.log(`[${tenantId}] Logged out or terminal failure. Cleanup.`);
                sessions.delete(tenantId);
                // Cleanup session files if it was a logout
                if (statusCode === DisconnectReason.loggedOut) {
                    if (fs.existsSync(authPath)) {
                        fs.rmSync(authPath, { recursive: true, force: true });
                    }
                }
            }
        } else if (connection === 'open') {
            console.log(`✅ [${tenantId}] Connected successfully!`);
            sessionData.isConnected = true;
            sessionData.qr = null;
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Forward incoming messages to Laravel Webhook
    sock.ev.on('messages.upsert', async m => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe && msg.message) {
                    const from = msg.key.remoteJid;
                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

                    if (text) {
                        console.log(`[${tenantId}] Message from ${from}: ${text}`);

                        const payload = {
                            tenant_id: tenantId, // Crucial for multi-tenancy
                            object: 'whatsapp_business_account',
                            entry: [{
                                changes: [{
                                    value: {
                                        messaging_product: 'whatsapp',
                                        metadata: { phone_number_id: 'unofficial' },
                                        contacts: [{ wa_id: from.split('@')[0] }],
                                        messages: [{
                                            from: from,
                                            id: msg.key.id,
                                            timestamp: msg.messageTimestamp,
                                            text: { body: text },
                                            type: 'text'
                                        }]
                                    }
                                }]
                            }]
                        };

                        try {
                            await axios.post(LARAVEL_WEBHOOK_URL, payload, {
                                timeout: 120000,
                                headers: { 'X-Bridge-Key': BRIDGE_API_KEY }
                            });
                        } catch (err) {
                            console.error(`[${tenantId}] Webhook Error:`, err.message);
                        }
                    }
                }
            }
        }
    });

    return sessionData;
}

// --- API Endpoints ---

/**
 * Get QR or Connection Status for a Tenant
 */
app.get('/status/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    let session = sessions.get(tenantId);

    if (!session) {
        // Try to auto-init if session folder exists (persistent login)
        const authPath = getAuthPath(tenantId);
        if (fs.existsSync(authPath)) {
            session = await initSession(tenantId);
        }
    }

    if (!session) {
        return res.json({ connected: false, qr: null, needsInit: true });
    }

    res.json({
        connected: session.isConnected,
        qr: session.qr,
        tenantId: session.tenantId
    });
});

/**
 * Initialize/Start session for a tenant
 */
app.post('/init/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    await initSession(tenantId);
    res.json({ success: true, message: `Session initialization started for ${tenantId}` });
});

/**
 * Send message from a specific tenant
 */
app.post('/send', async (req, res) => {
    const { tenantId, to, text } = req.body;
    
    const session = sessions.get(tenantId);
    if (!session || !session.isConnected) {
        return res.status(500).json({ error: `WhatsApp not connected for tenant ${tenantId}` });
    }

    try {
        await session.sock.sendMessage(to, { text });
        res.json({ success: true });
    } catch (err) {
        console.error(`[${tenantId}] Send Error:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Logout/Disconnect a tenant
 */
app.post('/logout/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    const session = sessions.get(tenantId);

    if (session) {
        try { await session.sock.logout(); } catch (_) {}
        sessions.delete(tenantId);
    }

    const authPath = getAuthPath(tenantId);
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
    }

    res.json({ success: true, message: `Tenant ${tenantId} disconnected and session cleared.` });
});

// --- Start Server ---
const PORT = 9000;
app.listen(PORT, () => {
    console.log(`\n🚀 O2OEG Multi-Tenant Bridge LIVE on port ${PORT}`);
    console.log(`📁 Sessions directory: ${SESSIONS_DIR}\n`);
    
    // Auto-resume existing sessions on start
    fs.readdirSync(SESSIONS_DIR).forEach(folder => {
        if (folder.startsWith('session_')) {
            const tId = folder.replace('session_', '');
            initSession(tId);
        }
    });
});
