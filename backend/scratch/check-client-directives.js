const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const hooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue', 'useDeferredValue', 'useTransition', 'useId', 'motion', 'AnimatePresence'];

walk('d:/SNS - ACADEMY/SNS_schools/frontend/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
        const hasHook = hooks.some(hook => {
            const regex = new RegExp(`\\b${hook}\\b`);
            return regex.test(content);
        });
        if (hasHook) {
            console.log(`Missing 'use client' in: ${filePath}`);
        }
    }
  }
});
