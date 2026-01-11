const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env manually to ensure we see what's on disk
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at ' + envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim();
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Configuration Check ---');

// 2. Validate URL Format
if (!SUPABASE_URL || !SUPABASE_URL.startsWith('https://')) {
    console.error('❌ SUPABASE_URL is missing or invalid (must start with https://)');
    console.error('   Current Value:', SUPABASE_URL || '(empty)');
} else {
    console.log('✅ SUPABASE_URL format is valid.');
}

// 3. Validate Key Length
if (!SUPABASE_KEY || SUPABASE_KEY.length < 20) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing or too short.');
    console.error('   Length:', SUPABASE_KEY ? SUPABASE_KEY.length : 0);
} else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY presence check passed (Length > 20).');
}

if (!SUPABASE_URL || !SUPABASE_KEY) process.exit(1);

// 4. Test Connectivity (JWKS Endpoint)
console.log('\n--- Network Connectivity (JWKS) ---');
const jwksUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/keys`;

https.get(jwksUrl, (res) => {
    console.log(`📡 GET ${jwksUrl} -> Status: ${res.statusCode}`);

    if (res.statusCode === 200) {
        console.log('✅ JWKS Endpoint is reachable.');
    } else {
        console.error('❌ JWKS Endpoint returned unexpected status.');
    }

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.keys) console.log('✅ JWKS Content is valid JSON.');
        } catch (e) {
            console.log('⚠️  JWKS Response is not JSON (might be expected if protected/proxy).');
        }

        // 5. Test Supabase Client Connection
        testSupabaseClient();
    });
}).on('error', (e) => {
    console.error('❌ Network Error:', e.message);
    process.exit(1);
});

async function testSupabaseClient() {
    console.log('\n--- Supabase Client Connection ---');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    try {
        // Try to insert a log to verify permissions (or select if table empty)
        // We'll try to select count from whatsapp_messages, or just health check
        // "from" validation requires valid table.
        // Let's rely on a simpler check: list buckets or just a simple query.
        // Properties table should exist if migration ran.

        // Check 'whatsapp_messages' existence?
        // Let's try to select 1 row from whatsapp_messages.
        const { data, error } = await supabase.from('whatsapp_messages').select('id').limit(1);

        if (error) {
            console.error('❌ Supabase Query Failed:', error.message);
            if (error.code === '42P01') console.error('   (Table whatsapp_messages might be missing - Run Migrations!)');
            if (error.code === 'PGRST301') console.error('   (JWT/Permission Error - Key likely invalid)');
        } else {
            console.log('✅ Connected to Supabase and queried table successfully!');
        }
    } catch (e) {
        console.error('❌ Supabase Client Exception:', e.message);
    }
}
