
import json

file_path = r'd:\CodeSpace\hbuilder-projects\lovey-record\docs\design-drafts\2026-03-22-design-tokene.pen'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find the Component Library frame
lib_frame = next(c for c in data['children'] if c.get('name') == 'Component Library / Light')

# Clear existing children and rebuild
lib_frame['layout'] = 'vertical'
lib_frame['gap'] = 64
lib_frame['padding'] = 64
lib_frame['fill'] = '$color.bg.base'

def create_section_title(text):
    return {
        "type": "text",
        "id": f"Title_{text[:5]}",
        "name": "section_title",
        "fill": "$color.text.primary",
        "content": text,
        "fontFamily": "IBM Plex Sans",
        "fontSize": 24,
        "fontWeight": "700"
    }

def create_pill_button(name, label, fill, text_fill, weight="600"):
    return {
        "type": "frame",
        "id": f"Btn_{name}",
        "name": f"Primitive/PillButton/{name}",
        "reusable": True,
        "width": 358,
        "fill": fill,
        "cornerRadius": 14,
        "padding": [12, 16],
        "justifyContent": "center",
        "alignItems": "center",
        "children": [
            {
                "type": "text",
                "id": f"Txt_{name}",
                "fill": text_fill,
                "content": label,
                "fontFamily": "IBM Plex Sans",
                "fontSize": 14,
                "fontWeight": weight
            }
        ]
    }

def create_calendar_day(id, day, num, fill, text_fill, stroke=None, decoration=None):
    day_frame = {
        "type": "frame",
        "id": f"Day_{id}",
        "width": "fill_container",
        "height": 56,
        "fill": fill,
        "cornerRadius": 10,
        "layout": "vertical",
        "gap": 4,
        "padding": [12, 4, 8, 4],
        "alignItems": "center",
        "children": [
            {
                "type": "text",
                "id": f"Num_{id}",
                "fill": text_fill,
                "content": str(num),
                "fontFamily": "IBM Plex Sans",
                "fontSize": 14,
                "fontWeight": "600"
            }
        ]
    }
    if stroke:
        day_frame["stroke"] = stroke
    if decoration:
        day_frame["children"].append(decoration)
    
    return {
        "type": "frame",
        "id": f"DayWrapper_{id}",
        "width": "fill_container",
        "layout": "vertical",
        "gap": 8,
        "alignItems": "center",
        "children": [
            {
                "type": "text",
                "id": f"DayName_{id}",
                "fill": "$color.text.muted",
                "content": day,
                "fontFamily": "IBM Plex Sans",
                "fontSize": 11,
                "fontWeight": "normal"
            },
            day_frame
        ]
    }

# Build children
new_children = [
    # Header
    {
        "type": "frame",
        "id": "Lib_Header",
        "layout": "vertical",
        "gap": 12,
        "children": [
            {
                "type": "text",
                "id": "Lib_Title",
                "fill": "$color.text.primary",
                "content": "Component Library / Light",
                "fontFamily": "IBM Plex Sans",
                "fontSize": 32,
                "fontWeight": "700"
            },
            {
                "type": "text",
                "id": "Lib_Desc",
                "fill": "$color.text.secondary",
                "content": "遵循单向 Token 供应链，优先保证原子性与状态完备。",
                "fontFamily": "IBM Plex Sans",
                "fontSize": 14
            }
        ]
    },
    
    # Section: Navigation
    {
        "type": "frame",
        "id": "Sec_Nav",
        "layout": "vertical",
        "gap": 24,
        "children": [
            create_section_title("Navigation / Header"),
            {
                "type": "frame",
                "id": "Nav_Row",
                "width": 358,
                "justifyContent": "space_between",
                "alignItems": "center",
                "children": [
                    {
                        "type": "frame",
                        "id": "Nav_Prev",
                        "fill": "$color.bg.secondary",
                        "cornerRadius": 12,
                        "padding": [8, 10],
                        "children": [{"type": "text", "id": "Nav_Prev_Txt", "fill": "$color.text.secondary", "content": "<", "fontSize": 14}]
                    },
                    {"type": "text", "id": "Nav_Title", "fill": "$color.text.primary", "content": "2026.03", "fontSize": 16, "fontWeight": "700"},
                    {
                        "type": "frame",
                        "id": "Nav_Next",
                        "fill": "$color.bg.secondary",
                        "cornerRadius": 12,
                        "padding": [8, 10],
                        "children": [{"type": "text", "id": "Nav_Next_Txt", "fill": "$color.text.secondary", "content": ">", "fontSize": 14}]
                    }
                ]
            }
        ]
    },

    # Section: Interaction
    {
        "type": "frame",
        "id": "Sec_Interaction",
        "layout": "vertical",
        "gap": 24,
        "children": [
            create_section_title("Interaction / Buttons"),
            {
                "type": "frame",
                "id": "Btn_Grid",
                "gap": 16,
                "children": [
                    create_pill_button("Filled", "主要操作", "$color.accent.primary", "$color.bg.card"),
                    create_pill_button("Soft", "次要操作", "$color.bg.secondary", "$color.text.secondary", "500")
                ]
            }
        ]
    },

    # Section: Calendar
    {
        "type": "frame",
        "id": "Sec_Calendar",
        "layout": "vertical",
        "gap": 24,
        "children": [
            create_section_title("Data Display / Week Calendar"),
            {
                "type": "frame",
                "id": "Cal_Row",
                "width": 358,
                "gap": 6,
                "children": [
                    create_calendar_day("Mon", "M", 23, "$color.bg.base", "$color.text.primary"),
                    create_calendar_day("Tue", "T", 24, "$color.accent.period.soft", "$color.text.primary"),
                    create_calendar_day("Wed", "W", 25, "$color.accent.period", "$color.bg.card"),
                    create_calendar_day("Thu", "T", 26, "$color.accent.period", "$color.bg.card"),
                    create_calendar_day("Fri", "F", 27, "$color.bg.base", "$color.text.primary", 
                                        stroke={"align": "inside", "thickness": 1, "fill": "#8E7C6D"},
                                        decoration={
                                            "type": "frame",
                                            "id": "Eye_Deco",
                                            "width": 18, "height": 10,
                                            "fill": "$color.accent.special",
                                            "cornerRadius": 999,
                                            "children": [{"type": "ellipse", "id": "Pupil", "x": 6, "y": 2, "fill": "$color.bg.base", "width": 6, "height": 6}]
                                        }),
                    create_calendar_day("Sat", "S", 28, "$color.bg.base", "$color.text.primary"),
                    create_calendar_day("Sun", "S", 29, "$color.bg.base", "$color.text.primary")
                ]
            },
            {
                "type": "text",
                "id": "Cal_Hint",
                "fill": "$color.text.muted",
                "content": "4 状态演示：默认、预测、经期中、特殊标记（眼睛）。",
                "fontSize": 12
            }
        ]
    }
]

lib_frame['children'] = new_children

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Component Library refreshed successfully.")
