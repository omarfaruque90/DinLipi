#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Read the file
with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line number containing the error message
target_line = None
for i, line in enumerate(lines):
    if 'I didn\'t catch an amount' in line or 'आपार कथा बुझ' in line:
        target_line = i
        break

if target_line is None:
    print("Could not find the target section")
    exit(1)

print(f"Found target at line {target_line}")

# Find the start of the else block (go backwards)
else_start = None
for i in range(target_line, max(target_line - 20, 0), -1):
    if '} else {' in lines[i]:
        else_start = i
        break

# Find the end of the block (go forwards)
block_end = None
brace_count = 0
for i in range(else_start, min(else_start + 50, len(lines))):
    line = lines[i]
    if '} else {' in line:
        brace_count += 1
    if '}' in line and i > else_start:
        brace_count -= 1
    if brace_count == 0:
        block_end = i + 1
        break

print(f"Block from {else_start} to {block_end}")

# Create the new block
new_block = '''    } else {
      // ──── Smart Intent Recognition with Financial Advisor ────
      const lower = lTxt.toLowerCase();

      // FINANCIAL ADVISOR MODE - Roadmap/Savings Plan
      if (/roadmap|savings|plan|save money|sanchay|bachat|kharch kam|খরচ কমাতে|বাঁচানো|সঞ্চয়|বাজেট|পরামর্শ/.test(lower)) {
        const roadmap = generateSavingsRoadmap(currentLang);
        addMsg('ai', roadmap);
        return;
      }

      // Balance Query
      if (/balance|kitna|how much|amar|total|status|কত|আমার/.test(lower)) {
        const { totalBal, totalInc, totalExp, expenseRatio } = getFinancialMetrics();
        const balMsg = currentLang === 'bn'
          ? `💰 <strong>Total:</strong> ৳${totalBal.toLocaleString()}<br/><strong>Income:</strong> ৳${totalInc.toLocaleString()}<br/><strong>Expense:</strong> ৳${totalExp.toLocaleString()}<br/><strong>Ratio:</strong> ${expenseRatio.toFixed(1)}%`
          : `💰 <strong>Total:</strong> ৳${totalBal.toLocaleString()}<br/><strong>Income:</strong> ৳${totalInc.toLocaleString()}<br/><strong>Expense:</strong> ৳${totalExp.toLocaleString()}<br/><strong>Ratio:</strong> ${expenseRatio.toFixed(1)}%`;
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
    }
  }, 500);
}
'''

# Replace the block
new_lines = lines[:else_start] + [new_block + '\n'] + lines[block_end:]

# Write back
with open('script.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Successfully updated AI with Financial Advisor mode!")
