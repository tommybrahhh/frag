from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import re
from urllib.parse import quote_plus
import os

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
    
    # Enable headless mode for production
    # chrome_options.add_argument('--headless')
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def search_google_selenium(perfume_name, driver):
    """
    Search Google using Selenium and return the first Fragrantica URL
    """
    try:
        # Format the search query
        search_query = f"{perfume_name} site:fragrantica.es OR site:fragrantica.com"
        encoded_query = quote_plus(search_query)
        
        # Navigate to Google
        driver.get(f"https://www.google.com/search?q={encoded_query}")
        
        # Wait for search results to load
        wait = WebDriverWait(driver, 10)
        
        try:
            # Wait for search results to appear
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'h3')))
            
            # Look for Fragrantica URLs in search results
            fragrantica_pattern = re.compile(r'https?://(?:www\.)?fragrantica\.(?:es|com)/perfume/')
            
            # Find all search result links
            results = driver.find_elements(By.CSS_SELECTOR, 'h3')
            
            for result in results:
                try:
                    # Get the parent link element
                    link_element = result.find_element(By.XPATH, './ancestor::a[1]')
                    href = link_element.get_attribute('href')
                    
                    if href and fragrantica_pattern.search(href):
                        return href
                except NoSuchElementException:
                    continue
            
            # Alternative approach: search for all links
            links = driver.find_elements(By.CSS_SELECTOR, 'a')
            for link in links:
                href = link.get_attribute('href')
                if href and fragrantica_pattern.search(href):
                    return href
            
            print(f"No Fragrantica URL found for: {perfume_name}")
            return None
            
        except TimeoutException:
            print("Timeout waiting for search results")
            return None
            
    except Exception as e:
        print(f"Error searching for {perfume_name}: {e}")
        return None

def search_multiple_perfumes_selenium(perfume_names):
    """
    Search for multiple perfume names using Selenium and return results
    """
    driver = setup_driver()
    results = {}
    
    try:
        for perfume_name in perfume_names:
            print(f"Searching for: {perfume_name}")
            fragrantica_url = search_google_selenium(perfume_name, driver)
            results[perfume_name] = fragrantica_url
            print(f"Result: {fragrantica_url}")
            print("-" * 50)
            
            # Add a small delay between searches
            time.sleep(2)
        
        return results
        
    finally:
        driver.quit()

def main():
    # Test with the provided examples
    test_perfumes = [
        "Nomade Eau de Parfum Chloé",
        "Pure Musc For Her Narciso Rodriguez"
    ]
    
    print("Starting Selenium Google search for Fragrantica URLs...")
    print("=" * 60)
    
    results = search_multiple_perfumes_selenium(test_perfumes)
    
    print("\nFinal Results:")
    print("=" * 60)
    for perfume, url in results.items():
        print(f"{perfume}: {url}")

if __name__ == "__main__":
    main()