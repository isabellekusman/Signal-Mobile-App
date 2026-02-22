import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as Sentry from 'npm:@sentry/deno';

Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN'),
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
        // 2. Auth Check (The user is deleting themselves, so they must be logged in)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization' }), {
                status: 401,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Get the calling user's ID
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        // 3. Create Admin Client (Must use Service Role to delete user)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 4. Soft Delete: Update profile with deleted_at timestamp
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) {
            Sentry.captureException(updateError, { extra: { context: 'Error soft deleting profile' } });
            return new Response(JSON.stringify({ error: 'Failed to update account status' }), {
                status: 500,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        // 5. Suspend User (Ban them to prevent login during the 30-day grace period)
        const { error: deleteError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { ban_duration: '876000h' } // Banned for 100 years
        );

        if (deleteError) {
            Sentry.captureException(deleteError, { extra: { context: 'Error deleting user' } });
            return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
                status: 500,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        Sentry.captureException(error, { extra: { context: 'Delete Account Error' } });
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }
});
