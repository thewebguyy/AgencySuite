const fs = require('fs');
const path = require('path');

function suggestFix(error, extractedData) {
    const { name, category, remediation, description } = error;
    const { route, runtime, stack } = extractedData;

    let codeFix = 'No automated patch available. Manual review required.';
    let fileToEdit = 'N/A';

    if (name === 'EDGE_RUNTIME_VIOLATION') {
        fileToEdit = (stack && stack[0].match(/[\w.-]+\.(ts|js|tsx|jsx)/)) ? stack[0].match(/[\w.-]+\.(ts|js|tsx|jsx)/)[0] : 'middleware.ts';
        codeFix = 'Move Node.js specific code (e.g., fs/path/crypto) into a non-edge serverless function or use standard web alternatives like fetch().';
    } else if (name === 'MISSING_ENV_VAR') {
        const envName = (extractedData.message.match(/([A-Z_0-9]{3,})/) || [])[0] || 'VARIABLE_NAME';
        fileToEdit = '.env.local';
        codeFix = `Check .env.example for required keys. Add ${envName}=<VALUE> to satisfy the application requirements.`;
    } else if (name === 'MIDDLEWARE_INVOCATION_FAILED') {
        fileToEdit = 'src/middleware.ts';
        codeFix = 'Check for unhandled rejections or infinite redirects in clerkMiddleware/Middleware configuration.';
    }

    return {
        description,
        remediation,
        codeFix,
        fileToEdit
    };
}

module.exports = { suggestFix };
