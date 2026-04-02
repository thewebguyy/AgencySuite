const fs = require('fs');
const path = require('path');

const EXAMPLE_PATH = path.join(process.cwd(), '.env.example');
const ENV_PATH = path.join(process.cwd(), '.env.local'); // Commonly used in Next.js dev

if (!fs.existsSync(EXAMPLE_PATH)) {
    console.error('❌ .env.example not found. Please provide an example env file.');
    process.exit(1);
}

const exampleContent = fs.readFileSync(EXAMPLE_PATH, 'utf8');
const exampleKeys = exampleContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim());

let envContent = '';
if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf8');
} else if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
}

const envKeys = envContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim());

const missingKeys = exampleKeys.filter(key => !envKeys.includes(key));

if (missingKeys.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingKeys.forEach(key => console.error(`- ${key}`));
    console.error('\nTips: Please check your .env.local file and update it accordingly.');
    process.exit(1);
} else {
    console.log('✅ Environment variable check passed.');
}
