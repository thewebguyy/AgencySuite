const fs = require('fs');
const path = require('path');

const MIDDLEWARE_PATH = path.join(process.cwd(), 'src', 'middleware.ts');

if (!fs.existsSync(MIDDLEWARE_PATH)) {
    console.log('✅ No middleware found, skipping edge runtime check.');
    process.exit(0);
}

const content = fs.readFileSync(MIDDLEWARE_PATH, 'utf8');

const FORBIDDEN_APIS = [
    'fs',
    'path',
    'require(',
    'process.env', // Not forbidden but maybe problematic?
    'child_process',
    'os',
    'dns',
    'net',
    'tls',
    'http',
    'https' // Wait, fetch should be used instead
];

const FORBIDDEN_PACKAGES = [
    'crypto', // Use Web Crypto API instead
    'util'
];

let errors = [];

FORBIDDEN_APIS.forEach(api => {
    if (content.includes(`import ${api}`) || content.includes(`from '${api}'`) || content.includes(`${api}.`) || content.includes(`${api}(`) || content.includes(`require('${api}')`)) {
        // Simple regex or check
        if (content.match(new RegExp(`\\b${api}\\b`))) {
            errors.push(`- Forbidden Node.js API used: ${api}`);
        }
    }
});

if (errors.length > 0) {
    console.error('❌ Edge Runtime Compatibility Error in middleware.ts:');
    errors.forEach(err => console.error(err));
    console.error('\nTips: Use Web APIs (fetch, crypto, etc.) instead of Node.js modules.');
    process.exit(1);
} else {
    console.log('✅ Middleware Edge compatibility check passed.');
}
