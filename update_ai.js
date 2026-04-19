const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(filePath, 'utf-8');

// Find the exact block to replace (from "} else {" to the closing "}" before ", 500);")
const lines = content.split('\n');
let startIdx = -1, endIdx = -1;

// Find the start of the else block with the error message
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("I didn't catch an amount")) {
    // Go back to find "} else {"
    for (let j = i; j >= Math.max(0, i - 20); j--) {
      if (lines[j].includes('} else {')) {
        startIdx = j;
        break;
      }
    }
    // Go forward to find the closing "}"
    for (let j = i; j < Math.min(lines.length, i + 20); j++) {
      if (lines[j].trim() === '}' && lines[j + 1] && lines[j + 1].includes(', 500)')) {
        endIdx = j;
        break;
      }
    }
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('❌ Could not find the block boundaries');
  process.exit(1);
}

console.log(`Found block from line ${startIdx} to ${endIdx}`);

// Create the new block
const newBlock = `    } else {
      // ──── Smart Intent Recognition with Financial Advisor ────
      const lower = lTxt.toLowerCase();

      // FINANCIAL ADVISOR MODE - Roadmap/Savings Plan
      if (/roadmap|savings|plan|save money|sanchay|bachat|খরচ কমাতে|বাঁচানো|সঞ্চয়|বাজেট|পরামর্শ/.test(lower)) {
        const roadmap = generateSavingsRoadmap(currentLang);
        addMsg('ai', roadmap);
        return;
      }

      // Balance Query
      if (/balance|kitna|how much|amar|total|status|কত|আমার/.test(lower)) {
        const { totalBal, totalInc, totalExp, expenseRatio } = getFinancialMetrics();
        const balMsg = currentLang === 'bn'
          ? \`💰 <strong>Total:</strong> ৳\${totalBal.toLocaleString()}<br/><strong>Income:</strong> ৳\${totalInc.toLocaleString()}<br/><strong>Expense:</strong> ৳\${totalExp.toLocaleString()}<br/><strong>Ratio:</strong> \${expenseRatio.toFixed(1)}%\`
          : \`💰 <strong>Total:</strong> ৳\${totalBal.toLocaleString()}<br/><strong>Income:</strong> ৳\${totalInc.toLocaleString()}<br/><strong>Expense:</strong> ৳\${totalExp.toLocaleString()}<br/><strong>Ratio:</strong> \${expenseRatio.toFixed(1)}%\`;
        addMsg('ai', balMsg);
        return;
      }

      // Greetings
      if (/^(hello|hi|hey|salam|yo|sup|assalam)/.test(lower)) {
        const reply = currentLang === 'bn' ? "Yo bhai! 👋" : "Yo bhai! 👋";
        addMsg('ai', reply);
        return;
      }

      // Thanks
      if (/^(thanks|thank|shukriya|dhonnobad)/.test(lower)) {
        const reply = currentLang === 'bn' ? "Anytime bhai! 😊" : "Anytime bhai! 😊";
        addMsg('ai', reply);
        return;
      }

      // Incomplete transaction
      const hasCat = CAT_MAP.some(c => c.keys.some(k => lower.includes(k.toLowerCase())));
      if (hasCat) {
        const reply = currentLang === 'bn'
          ? "Takar porimaan bolun bhai! 😊"
          : "Give me the amount bhai! 😊";
        addMsg('ai', reply);
        return;
      }

      // Default
      const reply = currentLang === 'bn'
        ? "Ami bujlam na. Balance? Roadmap? Naki transaction? 😊"
        : "Not sure bhai! Balance, roadmap, or add a transaction? 😊";
      addMsg('ai', reply);
    }`;

// Replace the block
const newLines = [
  ...lines.slice(0, startIdx),
  newBlock,
  ...lines.slice(endIdx + 1)
];

const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf-8');

console.log('✅ AI upgraded with Financial Advisor mode!');
