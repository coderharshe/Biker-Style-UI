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

async function signUpUser() {
    console.log("Signing up harshaggarwal1502@gmail.com...");
    const { data, error } = await supabase.auth.signUp({
        email: 'harshaggarwal1502@gmail.com',
        password: '#Harsh2006',
        options: {
            data: { username: 'HarshAggarwal' }
        }
    });

    if (error) {
        console.error("Signup error:", error.message);
    } else {
        console.log("Signup success! User ID:", data.user?.id);
    }
    process.exit(0);
}

signUpUser();
