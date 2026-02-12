const fs = require('fs');

const filePath = 'src/components/tasks/create-task-dialog.tsx';
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== FILE CONTENT ===');
console.log(content);
console.log('=== END OF FILE ===');
