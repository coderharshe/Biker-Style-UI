import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => {
            const index = line.indexOf('=');
            return [line.substring(0, index).trim(), line.substring(index + 1).trim()];
        })
);

const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function runTests() {
    console.log("=========================================");
    console.log("Running Velox RLS Security Tests");
    console.log("=========================================\n");
    
    // Login
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'harshaggarwal1502@gmail.com',
        password: '#Harsh2006'
    });
    
    if (authErr) {
        console.error("❌ Login failed!");
        console.error("  Message:", authErr.message);
        console.error("  Status:", authErr.status);
        process.exit(1);
    }
    
    const userId = authData.user.id;
    console.log(`✅ Authenticated User ID: ${userId}\n`);

    // Test 1: Try to insert a ride point for another user (should fail)
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    process.stdout.write("Test 1: Inserting ride point for another user... ");
    const { error: insertErr } = await supabase.from('ride_points').insert([
        { user_id: fakeUserId, lat: 0, lng: 0 }
    ]);
    
    // In Supabase, RLS failures often result in either a 42501 code or a silent drop 
    // depending on if it's an INSERT (fails) vs SELECT (returns []).
    if (insertErr && (insertErr.code === '42501' || insertErr.code === '42501')) {
        console.log("✅ Passed (Blocked by RLS)");
    } else {
        console.log("❌ Failed (Action wasn't blocked)");
        console.error("  Details:", insertErr);
    }
    
    // Test 2: Try to insert ride point for self (should succeed)
    process.stdout.write("Test 2: Inserting ride point for self... ");
    const { error: insertSelfErr } = await supabase.from('ride_points').insert([
        { user_id: userId, lat: 10, lng: 10 }
    ]);
    
    if (!insertSelfErr) {
        console.log("✅ Passed (Action Allowed)");
    } else {
        console.log("❌ Failed (Could not insert own data)");
        console.error("  Details:", insertSelfErr);
    }
    
    // Test 3: Updating another user's SOS alert (should fail quietly with 0 rows updated/returned)
    process.stdout.write("Test 3: Updating another user's SOS alert... ");
    const { data: sosData, error: sosErr } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved' })
        .eq('user_id', fakeUserId)
        .select();
        
    if (!sosErr && sosData.length === 0) {
        console.log("✅ Passed (Update prevented, 0 rows modified)");
    } else {
        console.log("❌ Failed (Update executed or different error)");
        console.error("  Details:", sosErr || sosData);
    }

    console.log("\n=========================================");
    console.log("Security Audit Complete");
    console.log("=========================================");
    process.exit(0);
}

runTests();
