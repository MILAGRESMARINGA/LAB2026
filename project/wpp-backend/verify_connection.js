const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('MISSING_CREDENTIALS');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConnection() {
    try {
        // Try to read from a public table or just check health?
        // We can try to just get the current user session or query a table.
        // Let's try to query 'properties' or just anything.
        // Since we provided SQL for properties, let's check it.
        // Or just check if we can query anything.
        const { data, error } = await supabase.from('properties').select('count', { count: 'exact', head: true });

        if (error) {
            // If error is 42P01 (undefined table), it means connected but table missing.
            // If error is related to auth/connection (ENOTFOUND), then failure.
            console.log('CONNECTION_ERROR:', error.message);
            return;
        }
        console.log('CONNECTION_SUCCESS');
    } catch (e) {
        console.log('CONNECTION_EXCEPTION:', e.message);
    }
}

checkConnection();
