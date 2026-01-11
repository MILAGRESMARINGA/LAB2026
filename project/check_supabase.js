const { createClient } = require('@supabase/supabase-js');

const url = 'https://fjqdcruinhfagqjgopju.supabase.co';
const key = 'sb_publishable_bWITGSSZfkk1PxqotAyE2A_RCGBOu8p';

const supabase = createClient(url, key);

async function test() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', url);
    console.log('Key:', key);

    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Session Check Error:', error.message);
        } else {
            console.log('✅ Session Check Success (Key accepted by Auth service)');
        }
    } catch (e) {
        console.error('Exception during Session Check:', e.message);
    }
}

test();
