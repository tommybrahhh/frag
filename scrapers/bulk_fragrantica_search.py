from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException
import csv
import time
import re
import random
from urllib.parse import quote_plus
import os
import json
import requests
from fake_useragent import UserAgent

def setup_driver(use_proxy=False, proxy_url=None):
    """Setup Chrome driver with advanced anti-detection options"""
    chrome_options = Options()
    
    # Advanced anti-detection options
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Basic options
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-popup-blocking')
    chrome_options.add_argument('--start-maximized')
    
    # Randomize user agent
    ua = UserAgent()
    user_agent = ua.random
    chrome_options.add_argument(f'--user-agent={user_agent}')
    
    # Language and locale settings
    chrome_options.add_argument('--lang=en-US,en;q=0.9')
    chrome_options.add_argument('--accept-language=en-US,en;q=0.9')
    
    # Proxy support
    if use_proxy and proxy_url:
        chrome_options.add_argument(f'--proxy-server={proxy_url}')
    
    # Disable images for faster loading (optional)
    # prefs = {"profile.managed_default_content_settings.images": 2}
    # chrome_options.add_experimental_option("prefs", prefs)
    
    # Enable headless mode for production (more detectable)
    # chrome_options.add_argument('--headless=new')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    # Execute JavaScript to hide automation
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    driver.execute_script("""
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 8,
        });
    """)
    
    # Remove navigator.webdriver flag
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        '''
    })
    
    return driver

def check_for_captcha(driver):
    """Check if CAPTCHA is present on the page"""
    try:
        # Check for various CAPTCHA indicators
        captcha_selectors = [
            '#captcha-form',
            '.g-recaptcha',
            'iframe[src*="recaptcha"]',
            'div[class*="captcha"]',
            'input[name*="captcha"]',
            'div#rc-anchor-container'
        ]
        
        for selector in captcha_selectors:
            if driver.find_elements(By.CSS_SELECTOR, selector):
                return True
                
        # Check for CAPTCHA in page source
        page_source = driver.page_source.lower()
        if 'captcha' in page_source or 'recaptcha' in page_source:
            return True
            
        return False
    except:
        return False

def handle_captcha(driver):
    """Handle CAPTCHA detection"""
    print("CAPTCHA detected! Please solve it manually...")
    print("The browser will wait for 60 seconds for you to solve the CAPTCHA")
    
    # Wait for user to solve CAPTCHA
    time.sleep(60)
    
    # Refresh the page after CAPTCHA is solved
    driver.refresh()
    time.sleep(5)

def search_google_selenium(perfume_name, driver):
    """
    Search Google using Selenium and return the first Fragrantica URL
    with improved anti-detection measures and better error handling
    """
    try:
        # Format the search query
        search_query = f"{perfume_name} site:fragrantica.es OR site:fragrantica.com"
        encoded_query = quote_plus(search_query)
        
        # Try different approaches
        approaches = [
            lambda: direct_search_approach(encoded_query, driver, perfume_name),
            lambda: homepage_search_approach(search_query, driver, perfume_name),
            lambda: alternative_domain_approach(search_query, encoded_query, driver, perfume_name)
        ]
        
        for approach in approaches:
            try:
                result = approach()
                if result:
                    return result
            except Exception as e:
                print(f"Search approach failed: {e}")
                continue
                
        return None
            
    except Exception as e:
        print(f"All search approaches failed for {perfume_name}: {e}")
        return None

def direct_search_approach(encoded_query, driver, perfume_name):
    """Direct search URL approach"""
    driver.get(f"https://www.google.com/search?q={encoded_query}")
    
    # Wait for search results to load with longer timeout
    wait = WebDriverWait(driver, 15)
    
    try:
        # Wait for search results to appear - try multiple selectors
        selectors_to_try = ['h3', 'div.g', 'a', 'div.rc']
        for selector in selectors_to_try:
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                break
            except:
                continue
        
        # Check for CAPTCHA
        if check_for_captcha(driver):
            print(f"CAPTCHA detected for: {perfume_name}")
            handle_captcha(driver)
            return direct_search_approach(encoded_query, driver, perfume_name)
        
        # Look for Fragrantica URLs in search results
        fragrantica_pattern = re.compile(r'https?://(?:www\.)?fragrantica\.(?:es|com)/perfume/')
        
        # Try multiple approaches to find links
        link_finders = [
            # Find h3 headings with links
            lambda: [result.find_element(By.XPATH, './ancestor::a[1]').get_attribute('href')
                    for result in driver.find_elements(By.CSS_SELECTOR, 'h3')
                    if result.find_element(By.XPATH, './ancestor::a[1]').get_attribute('href')],
            
            # Find all links
            lambda: [link.get_attribute('href') for link in driver.find_elements(By.CSS_SELECTOR, 'a')],
            
            # Find result divs with links
            lambda: [link.get_attribute('href') for result_div in driver.find_elements(By.CSS_SELECTOR, 'div.g')
                    for link in result_div.find_elements(By.CSS_SELECTOR, 'a')]
        ]
        
        for finder in link_finders:
            try:
                links = finder()
                for href in links:
                    if href and fragrantica_pattern.search(href):
                        return href
            except:
                continue
        
        print(f"No Fragrantica URL found for: {perfume_name}")
        return None
        
    except TimeoutException:
        print(f"Timeout in direct search for: {perfume_name}")
        return None

def homepage_search_approach(search_query, driver, perfume_name):
    """Homepage search approach"""
    driver.get("https://www.google.com")
    time.sleep(2)
    
    # Try to find search box
    search_box_selectors = ['textarea[name="q"]', 'input[name="q"]', 'textarea[title="Search"]', 'input[title="Search"]']
    
    for selector in search_box_selectors:
        try:
            search_box = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
            )
            search_box.clear()
            
            # Type slowly
            for char in search_query:
                search_box.send_keys(char)
                time.sleep(random.uniform(0.05, 0.1))
            
            time.sleep(random.uniform(0.5, 1.0))
            search_box.send_keys(Keys.RETURN)
            
            # Wait for results and proceed with link extraction
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'h3'))
            )
            
            fragrantica_pattern = re.compile(r'https?://(?:www\.)?fragrantica\.(?:es|com)/perfume/')
            links = driver.find_elements(By.CSS_SELECTOR, 'a')
            
            for link in links:
                href = link.get_attribute('href')
                if href and fragrantica_pattern.search(href):
                    return href
                    
            return None
            
        except:
            continue
    
    return None

def alternative_domain_approach(search_query, encoded_query, driver, perfume_name):
    """Try alternative Google domains"""
    google_domains = [
        ("https://www.google.es", f"https://www.google.es/search?q={encoded_query}"),
        ("https://www.google.de", f"https://www.google.de/search?q={encoded_query}"),
        ("https://www.google.fr", f"https://www.google.fr/search?q={encoded_query}"),
    ]
    
    for domain, search_url in google_domains:
        try:
            driver.get(search_url)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'h3'))
            )
            
            fragrantica_pattern = re.compile(r'https?://(?:www\.)?fragrantica\.(?:es|com)/perfume/')
            links = driver.find_elements(By.CSS_SELECTOR, 'a')
            
            for link in links:
                href = link.get_attribute('href')
                if href and fragrantica_pattern.search(href):
                    return href
                    
        except:
            continue
    
    return None

def alternative_search_approach(perfume_name, driver):
    """Alternative search approach when the main method fails"""
    try:
        search_query = f"{perfume_name} site:fragrantica.es OR site:fragrantica.com"
        encoded_query = quote_plus(search_query)
        
        # Try different Google domains
        google_domains = [
            "https://www.google.com",
            "https://www.google.es",
            "https://www.google.com/search"
        ]
        
        for domain in google_domains:
            try:
                if "search" in domain:
                    driver.get(f"{domain}?q={encoded_query}")
                else:
                    driver.get(domain)
                    time.sleep(2)
                    
                    # Try to find and interact with search box if on homepage
                    try:
                        search_box = WebDriverWait(driver, 5).until(
                            EC.element_to_be_clickable((By.NAME, 'q'))
                        )
                        search_box.clear()
                        search_box.send_keys(search_query)
                        search_box.send_keys(Keys.RETURN)
                    except:
                        # If search box not found, use direct URL
                        driver.get(f"https://www.google.com/search?q={encoded_query}")
                
                # Wait for results
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'h3'))
                )
                
                fragrantica_pattern = re.compile(r'https?://(?:www\.)?fragrantica\.(?:es|com)/perfume/')
                links = driver.find_elements(By.CSS_SELECTOR, 'a')
                
                for link in links:
                    href = link.get_attribute('href')
                    if href and fragrantica_pattern.search(href):
                        return href
                        
            except Exception as e:
                print(f"Alternative domain {domain} failed: {e}")
                continue
                
        return None
        
    except Exception as e:
        print(f"Alternative search approach failed: {e}")
        return None

def process_csv_bulk(input_file='search.csv', output_file='fragrantica_results.csv', use_proxy=False, proxy_url=None):
    """
    Process CSV file with perfume names and search for Fragrantica URLs
    """
    # Read perfume names from CSV
    perfume_names = []
    try:
        with open(input_file, 'r', newline='', encoding='latin-1') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip header row
            for row in reader:
                if row and row[0].strip():
                    perfume_names.append(row[0].strip())
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
        return
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return
    
    if not perfume_names:
        print("No perfume names found in the CSV file.")
        return
    
    print(f"Found {len(perfume_names)} perfume names to process...")
    
    results = []
    processed_count = 0
    
    # Process in smaller batches to handle browser disconnections
    batch_size = 5  # Smaller batches to avoid detection
    for batch_start in range(0, len(perfume_names), batch_size):
        batch_end = min(batch_start + batch_size, len(perfume_names))
        batch = perfume_names[batch_start:batch_end]
        
        print(f"\nProcessing batch {batch_start//batch_size + 1}/{(len(perfume_names)-1)//batch_size + 1}")
        print("=" * 50)
        
        # Setup driver for each batch with fresh session
        driver = setup_driver(use_proxy, proxy_url)
        
        try:
            for i, perfume_name in enumerate(batch, 1):
                global_index = batch_start + i
                print(f"Processing {global_index}/{len(perfume_names)}: {perfume_name}")
                
                try:
                    fragrantica_url = search_google_selenium(perfume_name, driver)
                    results.append([perfume_name, fragrantica_url])
                    print(f"Result: {fragrantica_url}")
                    processed_count += 1
                except Exception as e:
                    print(f"Error processing {perfume_name}: {e}")
                    results.append([perfume_name, None])
                
                print("-" * 50)
                
                # Add longer, more random delays between searches
                delay = random.uniform(8, 15)  # Longer delay between 8-15 seconds
                print(f"Waiting {delay:.1f} seconds before next search...")
                time.sleep(delay)
                
        except Exception as e:
            print(f"Batch error: {e}")
        finally:
            try:
                driver.quit()
            except:
                pass
            
            # Save progress after each batch
            try:
                with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow(['Perfume Name', 'Fragrantica URL'])
                    writer.writerows(results)
                print(f"\nProgress saved: {processed_count}/{len(perfume_names)} processed")
            except Exception as e:
                print(f"Error saving progress: {e}")
                # Try to create the file if it doesn't exist
                try:
                    if not os.path.exists(output_file):
                        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                            writer = csv.writer(csvfile)
                            writer.writerow(['Perfume Name', 'Fragrantica URL'])
                            writer.writerows(results)
                        print("Created new file and saved progress")
                except Exception as e2:
                    print(f"Failed to create file: {e2}")
            
            # Longer delay between batches
            if batch_end < len(perfume_names):
                batch_delay = random.uniform(30, 60)  # 30-60 second delay between batches
                print(f"Waiting {batch_delay:.1f} seconds before next batch...")
                time.sleep(batch_delay)
    
    print(f"\nFinal results saved to: {output_file}")
    print(f"Successfully processed: {processed_count}/{len(perfume_names)} perfumes")

def main():
    """Main function to process the CSV file with configurable options"""
    print("Starting bulk Fragrantica URL search with enhanced anti-detection...")
    print("=" * 70)
    
    # Check if fake-useragent is installed
    try:
        import fake_useragent
    except ImportError:
        print("Installing required package: fake-useragent")
        os.system("pip install fake-useragent")
        print("Package installed. Please restart the script.")
        return
    
    # Configuration options
    use_proxy = False  # Set to True if you have proxies
    proxy_url = None   # Example: "http://user:pass@proxy:port"
    
    process_csv_bulk(use_proxy=use_proxy, proxy_url=proxy_url)
    
    print("\nBulk processing completed!")
    print("Note: If you encounter CAPTCHAs frequently, consider:")
    print("1. Using residential proxies")
    print("2. Increasing delays between requests")
    print("3. Using a VPN service")
    print("4. Running during off-peak hours")

if __name__ == "__main__":
    main()