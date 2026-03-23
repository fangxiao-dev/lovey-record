
import json
import sys

file_path = r'd:\CodeSpace\hbuilder-projects\lovey-record\docs\design-drafts\2026-03-22-design-tokene.pen'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

try:
    json.loads(content)
    print("JSON is valid.")
except json.JSONDecodeError as e:
    print(f"Error: {e.msg}")
    print(f"Line: {e.lineno}, Col: {e.colno}, Pos: {e.pos}")
    start = max(0, e.pos - 50)
    end = min(len(content), e.pos + 50)
    print(f"Context: {content[start:end]!r}")
