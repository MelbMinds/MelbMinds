from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import csv
import time

BASE_URL = "https://handbook.unimelb.edu.au/search?query=&types[]=all&year=2025&level_type[]=all&campus_and_attendance_mode[]=all&org_unit[]=all&page={page}&sort=_score|desc"

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)

output = []
for page in range(1, 500):
    print(f"Scraping page {page}...")
    driver.get(BASE_URL.format(page=page))
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "li.search-result-item"))
        )
    except:
        print("No more results found. Stopping.")
        break
    results = driver.find_elements(By.CSS_SELECTOR, "li.search-result-item")
    if not results:
        print("No more results found. Stopping.")
        break
    for result in results:
        try:
            name = result.find_element(By.CSS_SELECTOR, "h3").text.strip()
            code = result.find_element(By.CSS_SELECTOR, ".search-result-item__code").text.strip()
            flags = result.find_elements(By.CSS_SELECTOR, ".search-result-item__flag")
            type_ = " | ".join([f.text.strip() for f in flags]) if flags else ""
            output.append({"code": code, "name": name, "type": type_})
        except Exception:
            continue
    time.sleep(0.5)

driver.quit()

with open("unimelb_subjects_html.csv", "w", newline='', encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["code", "name", "type"])
    writer.writeheader()
    writer.writerows(output)

print(f"Scraped {len(output)} subjects/courses. Saved to unimelb_subjects_html.csv.") 