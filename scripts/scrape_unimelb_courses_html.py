import requests
from bs4 import BeautifulSoup
import csv
import time

BASE_URL = "https://handbook.unimelb.edu.au/search?query=&types%5B%5D=all&year=2025&level_type%5B%5D=all&campus_and_attendance_mode%5B%5D=all&org_unit%5B%5D=all&page={page}&sort=_score%7Cdesc"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

output = []
for page in range(1, 500):  # Adjust max pages as needed
    print(f"Scraping page {page}...")
    url = BASE_URL.format(page=page)
    resp = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(resp.text, "html.parser")
    results = soup.find_all("div", class_="result__content")
    if not results:
        print("No more results found. Stopping.")
        break
    for result in results:
        code = result.find("span", class_="result__code")
        name = result.find("a", class_="result__title")
        type_ = result.find("span", class_="result__type")
        if code and name:
            output.append({
                "code": code.text.strip(),
                "name": name.text.strip(),
                "type": type_.text.strip() if type_ else ""
            })
    time.sleep(0.5)

with open("unimelb_subjects_html.csv", "w", newline='', encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["code", "name", "type"])
    writer.writeheader()
    writer.writerows(output)

print(f"Scraped {len(output)} subjects/courses. Saved to unimelb_subjects_html.csv.") 