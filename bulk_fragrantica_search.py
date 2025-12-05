from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import csv
import time
import re
import random
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
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-popup-blocking')
    chrome_options.add_argument('--start-maximized')
    
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
            print(f"Timeout waiting for search results for: {perfume_name}")
            return None
            
    except Exception as e:
        print(f"Error searching for {perfume_name}: {e}")
        return None

def process_csv_bulk(input_file='search.csv', output_file='fragrantica_results.csv'):
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
        
        # Setup driver for each batch
        driver = setup_driver()
        
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
                
                # Add a longer, random delay between searches to avoid rate limiting
                delay = random.uniform(3, 8)  # Random delay between 3-8 seconds
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
    
    print(f"\nFinal results saved to: {output_file}")
    print(f"Successfully processed: {processed_count}/{len(perfume_names)} perfumes")

def main():
    """Main function to process the CSV file"""
    print("Starting bulk Fragrantica URL search...")
    print("=" * 60)
    
    process_csv_bulk()
    
    print("\nBulk processing completed!")

if __name__ == "__main__":
    main()