const { classifyError } = require('./triage/classifier');
const { parseVercelLog } = require('./triage/parser');
const { suggestFix } = require('./triage/remediation');

const logInput = process.argv[2] ? process.argv.slice(2).join(' ') : '';

if (!logInput) {
    console.error('❌ Error: No log input provided. Usage: node scripts/triage-engine.js "<log string or JSON>"');
    process.exit(1);
}

const extractedData = parseVercelLog(logInput);
const classifiedError = classifyError(extractedData.message);
const resolution = suggestFix(classifiedError, extractedData);

console.log('--- 🛡️ AUTONOMOUS ERROR TRIAGE SYSTEM ---');
console.log('');
console.log(`🔍 Detected Error: ${classifiedError.name}`);
console.log(`🧠 Classification: ${classifiedError.category}`);
console.log(`💥 Root Cause: ${resolution.description}`);
console.log(`🔗 Route Affected: ${extractedData.route}`);
console.log(`🕒 Runtime: ${extractedData.runtime}`);
console.log('');
console.log(`🔧 Fix: ${resolution.remediation}`);
console.log(`📁 Files to Edit: ${resolution.fileToEdit}`);
console.log(`💡 Suggested Patch: ${resolution.codeFix}`);

if (extractedData.stack && extractedData.stack.length > 0) {
    console.log('');
    console.log('🧩 Top Stack Trace Lines:');
    extractedData.stack.forEach(line => console.log(`  - ${line}`));
}

process.exit(0);
