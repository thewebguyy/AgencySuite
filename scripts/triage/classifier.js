const ERROR_MAP = [
    {
        name: 'EDGE_RUNTIME_VIOLATION',
        regex: /Vercel Edge Runtime does not support|The following Node\.js modules were not found|is not supported in Edge Runtime/i,
        category: 'Middleware/Edge Runtime',
        description: 'Attempted to use Node.js-only APIs in a standard Edge Runtime (middleware.ts or edge-enabled route).',
        remediation: 'Replace Node.js modules (fs, path, etc.) with Web Standard APIs (fetch, crypto) or move logic to a standard Node.js serverless function.'
    },
    {
        name: 'MISSING_ENV_VAR',
        regex: /Environment variable .* is missing|process\.env\..* is undefined|Variable not found: /i,
        category: 'Configuration',
        description: 'The application attempted to access an environment variable that is not defined in the runtime environment.',
        remediation: 'Add the missing variable to Vercel Dashboard Settings > Environment Variables or .env.local for local dev.'
    },
    {
        name: 'DEPENDENCY_CONFLICT',
        regex: /ERESOLVE could not resolve|Peer dependency mismatch|Module not found: Error: Can't resolve/i,
        category: 'Build/Dependencies',
        description: 'Installed packages have incompatible peer dependencies or a module is missing from package.json.',
        remediation: 'Run "npm prune && npm install" or use "--legacy-peer-deps" if you are sure about the version override.'
    },
    {
        name: 'MIDDLEWARE_INVOCATION_FAILED',
        regex: /MIDDLEWARE_INVOCATION_FAILED|500 Error: Failed to execute middleware/i,
        category: 'Middleware Failure',
        description: 'The middleware crashed during execution, possibly due to a runtime error or unhandled promise rejection.',
        remediation: 'Check middleware.ts for try/catch blocks and ensure any redirect logic doesn\'t cause an infinite loop.'
    },
    {
        name: 'API_ROUTE_CRASH',
        regex: /Runtime\.ImportModuleError|Task timed out after|Runtime exited with error/i,
        category: 'API/Serverless Route',
        description: 'A serverless function crashed, likely due to an unhandled exception or timeout.',
        remediation: 'Check logs for specific route stack traces. Increase function timeout in next.config.js if necessary.'
    }
];

function classifyError(logText) {
    for (const pattern of ERROR_MAP) {
        if (pattern.regex.test(logText)) {
            return {
                ...pattern,
                matched: true
            };
        }
    }
    return {
        name: 'UNKNOWN_ERROR',
        category: 'Unclassified',
        description: 'The error pattern was not recognized by the current engine.',
        remediation: 'Manual investigation required. Add this pattern to classifier.js once root cause is identified.',
        matched: false
    };
}

module.exports = { classifyError };
