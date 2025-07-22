import csv
import json

csv_path = "unimelb_subjects_html.csv"
json_path = "unimelb_subjects_html.json"

data = []
seen = set()
with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        key = (row["code"], row["name"])
        if key not in seen:
            seen.add(key)
            data.append({
                "code": row["code"],
                "name": row["name"],
                "type": row["type"]
            })

with open(json_path, "w", encoding='utf-8') as jsonfile:
    json.dump(data, jsonfile, indent=2, ensure_ascii=False)