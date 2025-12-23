
import requests
from bs4 import BeautifulSoup
import csv
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time # Added time import

def setup_driver():
    """Setup Chrome driver with appropriate options"""
    chrome_options = Options()
    
    # Add options to make browser look more like a real user
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Enable headless mode
    chrome_options.add_argument('--headless')
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def scrape_fragrantica_awards(url):
    driver = setup_driver()
    
    try:
        driver.get(url)
        # Add a longer sleep to ensure dynamic content has ample time to load for debugging purposes
        time.sleep(10)
        
        page_source = driver.page_source
        
        # Always save the page source to a local HTML file for debugging, regardless of explicit wait success
        with open("debug_awards_page.html", "w", encoding="utf-8") as f:
            f.write(page_source)
        print("Page source saved to debug_awards_page.html for inspection.")
        
        # For now, return an empty list. We are debugging page content, not scraping yet.
        return []

    except Exception as e:
        print(f"Error fetching the URL with Selenium: {e}")
        return []
    finally:
        driver.quit()

if __name__ == "__main__":
    url = "https://www.fragrantica.com/awards2025/category/Best-Womens-Fragrance-2025"
    scraped_data = scrape_fragrantica_awards(url)

    if scraped_data:
        output_csv_path = "fragrantica_awards_2025.csv"
        
        field_names = scraped_data[0].keys()
        
        with open(output_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=field_names)
            writer.writeheader()
            writer.writerows(scraped_data)
        print(f"Data successfully scraped and saved to {output_csv_path}")
        
        for item in scraped_data:
            print(item)
    else:
        print("No data scraped.")


