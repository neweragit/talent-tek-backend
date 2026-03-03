#!/usr/bin/env node

/**
 * TalentHub Backend Setup Helper
 * This script helps you configure your Supabase connection
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

console.log('\n🚀 TalentHub Backend Setup\n');
console.log('This will help you configure your Supabase connection.\n');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  try {
    console.log('📋 Please provide your Supabase credentials:');
    console.log('   (Find these in your Supabase project settings)\n');

    const supabaseUrl = await question('Supabase Project URL: ');
    const supabaseKey = await question('Supabase Anon Key: ');

    if (!supabaseUrl || !supabaseKey) {
      console.log('\n❌ Both URL and Key are required!');
      rl.close();
      process.exit(1);
    }

    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl.trim()}
VITE_SUPABASE_ANON_KEY=${supabaseKey.trim()}
`;

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Configuration saved to .env');
    console.log('\n📝 Next steps:');
    console.log('   1. Go to your Supabase dashboard > SQL Editor');
    console.log('   2. Copy the content from "database schema.sql"');
    console.log('   3. Execute the SQL to create tables and sample data');
    console.log('   4. Run: npm run dev');
    console.log('   5. Login with: abderraouf.education@gmail.com / password123');
    console.log('\n🎉 Setup complete!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setup();
