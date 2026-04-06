import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const { record, table, type } = await req.json();

    // Only handle new SOS alerts
    if (table !== 'sos_alerts' || type !== 'INSERT') {
      return new Response('Not an SOS insert', { status: 200 });
    }

    const { lat, lng, user_id } = record;

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find the SOS sender's name
    const { data: sender } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user_id)
      .single();

    const senderName = sender?.username || 'A rider';

    // 2. Fetch all user push tokens
    // Optimization for 10k users: In a real production app, we would use a PostGIS spatial query 
    // here to find users within X km. For now, we fetch all to ensure delivery.
    const { data: tokens } = await supabase
      .from('user_push_tokens')
      .select('expo_push_token')
      .neq('user_id', user_id); // Don't notify the sender

    if (!tokens || tokens.length === 0) {
      return new Response('No tokens found', { status: 200 });
    }

    const message = {
      to: tokens.map(t => t.expo_push_token),
      sound: 'default',
      title: '🚨 EMERGENCY: SOS ALERT',
      body: `${senderName} has triggered an SOS nearby! Tap to see location.`,
      data: { lat, lng, type: 'SOS' },
      priority: 'high'
    };

    // 3. Send to Expo
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
