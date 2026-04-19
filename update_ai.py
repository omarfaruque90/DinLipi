#!/usr/bin/env python3
import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the old else block with the new intent recognition
old_block = '''    } else {
      const reply = currentLang === 'bn'
        ? "আমি আপনার কথা বুঝতে পারিনি। দয়া করে টাকার পরিমাণ উল্লেখ করুন ভাই!"
        : "I didn't catch an amount there, bhai. Give me a number!";
      addMsg('ai', reply);
    }
  }, 500);
}'''

new_block = '''    } else {
      // ──── Smart Intent Recognition ────
      const lower = lTxt.toLowerCase();

      // 1. Greetings
      if (/^(hello|hi|hey|salam|yo|sup|assalamualaikum)/.test(lower)) {
        const reply = currentLang === 'bn'
          ? "Assalamu Alaikum bhai! 👋 Kye khabar?"
          : "Yo bhai! 👋 What's up?";
        addMsg('ai', reply);
        return;
      }

      // 2. Thanks
      if (/^(thanks|thank|shukriya|dhonnobad)/.test(lower)) {
        const reply = currentLang === 'bn'
          ? "Anytime bhai! 😊"
          : "Anytime bhai! 😊";
        addMsg('ai', reply);
        return;
      }

      // 3. Financial Advisor - Roadmap
      if (/roadmap|savings|plan|save money|sanchay|bachat|খরচ কমাতে|বাঁচানো|সঞ্চয়|বাজেট|পরামর্শ/.test(lower)) {
        const roadmap = generateSavingsRoadmap(currentLang);
        addMsg('ai', roadmap);
        return;
      }

      // 4. Balance Query
      if (/balance|kitna|how much|amar|total|status|কত|আমার/.test(lower)) {
        const { totalBal, totalInc, totalExp, expenseRatio } = getFinancialMetrics();
        if (currentLang === 'bn') {
          addMsg('ai', `💰 Balance: <strong>৳${totalBal.toLocaleString()}</strong><br/>Income: ৳${totalInc.toLocaleString()}<br/>Expense: ৳${totalExp.toLocaleString()}<br/>Ratio: ${expenseRatio.toFixed(1)}%`);
        } else {
          addMsg('ai', `💰 Balance: <strong>৳${totalBal.toLocaleString()}</strong><br/>Income: ৳${totalInc.toLocaleString()}<br/>Expense: ৳${totalExp.toLocaleString()}<br/>Ratio: ${expenseRatio.toFixed(1)}%`);
        }
        return;
      }

      // 5. Incomplete transaction
      const hasCat = CAT_MAP.some(c => c.keys.some(k => lower.includes(k.toLowerCase())));
      if (hasCat) {
        const reply = currentLang === 'bn'
          ? "Takar porimaan bolun bhai! 😊"
          : "Give me the amount bhai! 😊";
        addMsg('ai', reply);
        return;
      }

      // 6. Default
      const reply = currentLang === 'bn'
        ? "Ami bujlam na. Balance chai? Roadmap chai? Naki transaction? 😊"
        : "Not sure bhai! Ask about balance, roadmap, or add a transaction 😊";
      addMsg('ai', reply);
    }
  }, 500);
}'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('script.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ AI upgraded with Financial Advisor mode!")
else:
    print("❌ Could not find the old block to replace")
