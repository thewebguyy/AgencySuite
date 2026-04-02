const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Check for .js files in src
function findJSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
            findJSFiles(filePath, fileList);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const srcPath = path.join(process.cwd(), 'src');
if (fs.existsSync(srcPath)) {
    const jsFiles = findJSFiles(srcPath);
    if (jsFiles.length > 0) {
        console.error('❌ Found JavaScript files in src directory:');
        jsFiles.forEach(file => console.error(`- ${file}`));
        console.error('\nTips: Please convert them to TypeScript or remove them if they are compiled artifacts.');
        process.exit(1);
    }
}

// 2. Check if .next is tracked by Git
try {
    const trackedFiles = execSync('git ls-files .next', { encoding: 'utf8' });
    if (trackedFiles.trim()) {
        console.error('❌ .next directory is currently being tracked by Git!');
        console.error('Run "git rm -r --cached .next" to remove it from the index.');
        process.exit(1);
    }
} catch (error) {
    // If .next folder doesn't exist, git command might fail but it's okay
}

console.log('✅ Source directory and Git index are clean.');
process.exit(0);
