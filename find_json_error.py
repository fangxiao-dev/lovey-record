
import os

file_path = r'd:\CodeSpace\hbuilder-projects\lovey-record\docs\design-drafts\2026-03-22-design-tokene.pen'
with open(file_path, 'rb') as f:
    content = f.read()

depth = 0
in_string = False
escape = False

for i, b in enumerate(content):
    char = chr(b)
    if char == '"' and not escape:
        in_string = not in_string
    if in_string:
        if char == '\\' and not escape:
            escape = True
        else:
            escape = False
        continue
    
    if char == '{':
        depth += 1
    elif char == '}':
        depth -= 1
        if depth == 0:
            print(f"Root closed at: {i}")
            # Peek next 50 chars
            peek = content[i+1:i+51]
            print(f"Next chars: {peek}")
            break

print(f"Total length: {len(content)}")
