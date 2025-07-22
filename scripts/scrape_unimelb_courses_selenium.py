"""
Selenium-based scraper for University of Melbourne Handbook subjects only.

Setup:
1. pip install selenium
2. Download ChromeDriver from https://sites.google.com/chromium.org/driver/ and place it in your PATH
3. Run: python scrape_unimelb_courses_selenium.py
"""
import csv
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "https://handbook.unimelb.edu.au/search?types[]=subject&year=2025&subject_level_type[]=all&study_periods[]=all&area_of_study[]=all&org_unit[]=all&campus_and_attendance_mode[]=all&page={page}&sort=_score|desc"

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)

existing_codes = set()
output = []

# Load existing codes if CSV exists
csv_path = "unimelb_subjects_html.csv"
if os.path.exists(csv_path):
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_codes.add(row["code"])
            output.append(row)

empty_pages = 0
for page in range(235, 310+1):  # Resume from where it stopped
    print(f"Scraping page {page}...")
    driver.get(BASE_URL.format(page=page))
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "li.search-result-item"))
        )
    except Exception as e:
        print(f"Timeout or error on page {page}: {e}")
        with open(f"debug_page_{page}.html", "w", encoding="utf-8") as dbg:
            dbg.write(driver.page_source)
        empty_pages += 1
        if empty_pages >= 5:
            print("Too many consecutive empty/error pages. Stopping.")
            break
        continue
    results = driver.find_elements(By.CSS_SELECTOR, "li.search-result-item")
    if not results:
        print(f"No results found on page {page}.")
        with open(f"debug_page_{page}.html", "w", encoding="utf-8") as dbg:
            dbg.write(driver.page_source)
        empty_pages += 1
        if empty_pages >= 5:
            print("Too many consecutive empty/error pages. Stopping.")
            break
        continue
    empty_pages = 0  # Reset counter if results found
    for result in results:
        try:
            name = result.find_element(By.CSS_SELECTOR, "h3").text.strip()
            code = result.find_element(By.CSS_SELECTOR, ".search-result-item__code").text.strip()
            flags = result.find_elements(By.CSS_SELECTOR, ".search-result-item__flag")
            type_ = " | ".join([f.text.strip() for f in flags]) if flags else ""
            if code not in existing_codes:
                output.append({"code": code, "name": name, "type": type_})
                existing_codes.add(code)
        except Exception:
            continue
    time.sleep(0.5)

driver.quit()

with open(csv_path, "w", newline='', encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["code", "name", "type"])
    writer.writeheader()
    writer.writerows(output)

print(f"Scraped {len(output)} subjects. Saved to unimelb_subjects_html.csv.")