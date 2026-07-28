const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const targetContent = html.substring(html.indexOf('// Populate Advanced Analytics Shot Chart & Miss Breakdown'), html.indexOf('// Show intermediate player summary screen'));

const newContent = `this.populateAnalyticsModal(this.currentShotLog || []);

          `;

html = html.replace(targetContent, newContent);

const insertIdx = html.indexOf('startNextTurnFromSummary() {');
const methodContent = `populateAnalyticsModal(logs) {
${targetContent.replace('const logs = this.currentShotLog || [];', '')}
        }

        `;

html = html.slice(0, insertIdx) + methodContent + html.slice(insertIdx);

fs.writeFileSync('index.html', html);
