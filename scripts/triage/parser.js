function parseVercelLog(rawLog) {
    let logData = {};
    
    // Attempt to parse as JSON if possible
    try {
        logData = JSON.parse(rawLog);
    } catch (e) {
        // If not JSON, it's a raw string, we'll try to extract features
        logData = {
            message: rawLog,
            timestamp: new Date().toISOString()
        };
    }

    const { message, text, body, path, runtime } = logData;
    const logContent = message || text || body || rawLog;
    
    const extracted = {
        message: logContent,
        route: path || (logContent.match(/\/(api|dashboard|proposals)[\w\/-]+/i) || [])[0] || 'Unknown Root/Route',
        runtime: runtime || (logContent.includes('Edge') ? 'Edge' : 'Node.js'),
        timestamp: logData.timestamp || 'Current/Unknown'
    };
    
    // Try to extract stack traces
    const stackMatch = logContent.match(/at\s+[\w.<>\[\]]+\s+\([\w/\\:.-]+\)/g);
    if (stackMatch) {
            extracted.stack = stackMatch.slice(0, 5); // Take top 5 lines
    }

    return extracted;
}

module.exports = { parseVercelLog };
