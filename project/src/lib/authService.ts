import { supabase } from './supabase';

export async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();

    if (session && session.access_token) {
        return session.access_token;
    }

    return null;
}
