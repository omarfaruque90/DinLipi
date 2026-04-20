import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the hasFinancialKeywords definition with hasPlanKeywords
old_pattern = r"const hasFinancialKeywords = .*?\btest\(lTxt\);"
new_code = """const hasPlanKeywords = /save|saving|savings|invest|investment|plan|planning|roadmap|strategy|kmne|kiveabe|ki\\s*korbo/i.test(lTxt);"""
content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed hasPlanKeywords definition successfully")
