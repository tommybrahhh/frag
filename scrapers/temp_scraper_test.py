
import requests
from bs4 import BeautifulSoup
import time
import random
import cloudscraper
import re
import csv
from urllib.parse import urlparse
import logging
from fake_useragent import UserAgent
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import json
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper_v2.log'),
        logging.StreamHandler()
    ]
)

class EnhancedFragranticaScraperV2:
    def __init__(self):
        self.user_agent_rotator = UserAgent()
        self.request_count = 0
        self.last_request_time = 0
        self.blocked_count = 0
        self.session = self._create_session_with_retry()
        self.last_block_time = None
        
    def _create_session_with_retry(self):
        """Create a session with retry logic"""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=2,  # Reduced retries to avoid excessive retries on 429
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def _get_random_user_agent(self):
        """Get a random user agent with more variety"""
        browsers = ['chrome', 'firefox', 'safari', 'edge']
        platforms = ['windows', 'macos', 'linux']
        
        return self.user_agent_rotator.random
    
    def _throttle_requests(self):
        """Implement more intelligent request throttling with longer delays"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # More conservative delays based on request frequency and block history
        if self.blocked_count > 2:
            min_delay = 60
            max_delay = 120
        elif self.blocked_count > 0:
            min_delay = 40
            max_delay = 80
        elif self.request_count > 30:
            min_delay = 30
            max_delay = 60
        elif self.request_count > 15:
            min_delay = 20
            max_delay = 40
        else:
            min_delay = 15
            max_delay = 30
        
        # Add more jitter to make pattern less predictable
        jitter = random.uniform(0.7, 1.8)
        delay = random.uniform(min_delay, max_delay) * jitter
        
        # If we were recently blocked, add additional cooldown
        if self.last_block_time and (current_time - self.last_block_time) < 300:  # 5 minutes
            delay += random.uniform(30, 60)
        
        if time_since_last < delay:
            sleep_time = delay - time_since_last
            logging.info(f"Throttling: Sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def _get_realistic_headers(self, url):
        """Generate more realistic browser headers"""
        referrers = [
            'https://www.google.com/',
            'https://www.bing.com/',
            'https://duckduckgo.com/',
            'https://www.fragrantica.com/',
            'https://www.fragrantica.es/'
        ]
        
        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Referer': random.choice(referrers)
        }
        
        return headers
    
    def _bypass_cloudflare_enhanced(self, url, max_retries=2):
        """Enhanced Cloudflare bypass with better strategies"""
        for attempt in range(max_retries):
            try:
                self._throttle_requests()
                
                # Use cloudscraper with more varied browser profiles
                browser_profiles = [
                    {'browser': 'chrome', 'platform': 'windows', 'mobile': False},
                    {'browser': 'firefox', 'platform': 'windows', 'mobile': False},
                    {'browser': 'chrome', 'platform': 'darwin', 'mobile': False},
                    {'browser': 'firefox', 'platform': 'darwin', 'mobile': False}
                ]
                
                scraper = cloudscraper.create_scraper(
                    browser=random.choice(browser_profiles),
                    interpreter='nodejs',
                    delay=random.uniform(5, 15)
                )
                
                headers = self._get_realistic_headers(url)
                
                logging.info(f"Attempt {attempt + 1}: Making request to {url}")
                
                response = scraper.get(
                    url, 
                    headers=headers,
                    timeout=45,
                    allow_redirects=True
                )
                
                logging.info(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    logging.info("Successfully bypassed Cloudflare protection!")
                    self.blocked_count = max(0, self.blocked_count - 1)  # Reduce block counter on success
                    return response, scraper
                
                # If blocked, wait much longer and reset strategy
                if response.status_code in [403, 429, 503]:
                    self.blocked_count += 1
                    self.last_block_time = time.time()
                    logging.warning(f"Blocked with status {response.status_code}. Block count: {self.blocked_count}")
                    
                    # Progressive waiting based on block count
                    if self.blocked_count > 2:
                        wait_time = random.uniform(300, 600)  # 5-10 minutes for multiple blocks
                    else:
                        wait_time = random.uniform(120, 240)  # 2-4 minutes
                    
                    logging.warning(f"Waiting {wait_time:.2f} seconds before retry...")
                    time.sleep(wait_time)
                    
                    # Try with completely different setup
                    headers = self._get_realistic_headers(url)
                    response = scraper.get(url, headers=headers, timeout=45)
                    
                    if response.status_code == 200:
                        return response, scraper
                
                time.sleep(random.uniform(20, 40))
                
            except Exception as e:
                logging.error(f"Attempt {attempt + 1} failed: {e}")
                time.sleep(random.uniform(30, 60))
        
        return None, None
    
    def scrape_fragrantica(self, url):
        """Scraping function with enhanced bot detection avoidance"""
        try:
            response, scraper = self._bypass_cloudflare_enhanced(url)
            
            if not response or response.status_code != 200:
                logging.error("Failed to bypass Cloudflare after multiple attempts")
                return None, None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Determine the base URL for relative image paths
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            
            # Check if it's a perfume detail page
            name_tag_perfume_detail = soup.find('h1', itemprop='name')
            img_tag_perfume_detail = soup.find('img', itemprop='image')
            
            if name_tag_perfume_detail and img_tag_perfume_detail:
                # Extract perfume name
                for s in name_tag_perfume_detail.find_all('small'):
                    s.extract()
                perfume_name = name_tag_perfume_detail.get_text(strip=True)
                
                # Extract image URL
                image_url = img_tag_perfume_detail.get('src')
                if image_url and image_url.startswith('//'):
                    image_url = 'https:' + image_url
                elif image_url and image_url.startswith('/'):
                    image_url = base_url + image_url
                
                logging.info(f"Perfume Name: {perfume_name}")
                logging.info(f"Image URL: {image_url}")
                
                return [{"name": perfume_name, "image_url": image_url}], soup
            
            else:
                logging.warning("Not a perfume detail page or structure changed")
                return None, soup
                
        except Exception as e:
            logging.error(f"Error during scraping: {e}")
            import traceback
            traceback.print_exc()
            return None, None
    
    def process_csv(self, input_filename="perfumes.csv", output_filename="output_perfumes_v2.csv"):
        """Process the CSV file with enhanced scraping"""
        all_perfume_data_rows = []
        
        try:
            with open(input_filename, 'r', newline='', encoding='latin-1') as infile:
                reader = csv.reader(infile, delimiter=';')
                header = next(reader)
                
                output_header = header 
                all_perfume_data_rows.append(output_header)
                
                total_rows = sum(1 for row in reader)
                infile.seek(0)  # Reset to beginning
                next(reader)  # Skip header again
                
                logging.info(f"Processing {total_rows} perfumes with enhanced anti-detection...")
                
                for row_index, row in enumerate(reader):
                    if not row:
                        continue
                    
                    current_row = list(row)
                    original_perfume_name = current_row[0].strip() if len(current_row) > 0 else "N/A"
                    fragrantica_page_url = current_row[1].strip() if len(current_row) > 1 else ""
                    
                    fragrantica_name = "Not Found"
                    image_url = "Not Found"
                    
                    logging.info(f"--- Processing {row_index + 1}/{total_rows}: {original_perfume_name} ---")
                    
                    if fragrantica_page_url:
                        logging.info(f"Using Fragrantica URL: {fragrantica_page_url}")
                        
                        scraped_info, soup_obj = self.scrape_fragrantica(fragrantica_page_url)
                        
                        if scraped_info:
                            if isinstance(scraped_info, list) and len(scraped_info) > 0:
                                fragrantica_name = scraped_info[0].get("name", "Not Found")
                                image_url = scraped_info[0].get("image_url", "Not Found")
                        
                        # Save debug HTML for troubleshooting
                        if soup_obj:
                            with open('debug_fragrantica_v2.html', 'w', encoding='utf-8') as f:
                                f.write(soup_obj.prettify())
                    else:
                        logging.info(f"No URL provided for '{original_perfume_name}'")
                    
                    # Ensure row has enough columns
                    while len(current_row) < 4:
                        current_row.append("")
                    
                    current_row[2] = fragrantica_name
                    current_row[3] = image_url
                    all_perfume_data_rows.append(current_row)
                    
                    # Save progress every 3 rows (more frequent to preserve data)
                    if (row_index + 1) % 3 == 0:
                        self._save_progress(all_perfume_data_rows, output_filename)
                        logging.info(f"Saved progress after {row_index + 1} rows")
                        
                    # If we've been blocked multiple times, take a longer break
                    if self.blocked_count >= 3:
                        long_break = random.uniform(600, 1200)  # 10-20 minutes
                        logging.warning(f"Multiple blocks detected. Taking long break of {long_break:.2f} seconds")
                        time.sleep(long_break)
                        self.blocked_count = 0  # Reset counter after long break
                        
        except FileNotFoundError:
            logging.error(f"Error: {input_filename} not found.")
            return
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            import traceback
            traceback.print_exc()
        
        # Final save
        self._save_progress(all_perfume_data_rows, output_filename)
        logging.info(f"Processing complete. Data saved to {output_filename}")
    
    def _save_progress(self, data, filename):
        """Save progress to CSV"""
        with open(filename, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.writer(outfile, delimiter=';')
            writer.writerows(data)

if __name__ == "__main__":
    # Initialize the enhanced scraper
    scraper = EnhancedFragranticaScraperV2()
    
    # Process the CSV
    # scraper.process_csv()

    # Test scraping a search results page
    url = "https://www.fragrantica.com/search/?godina=2026%3A2026"
    scraped_data, soup_object = scraper.scrape_fragrantica(url)
    
    if soup_object:
        with open('debug_search_results.html', 'w', encoding='utf-8') as f:
            f.write(soup_object.prettify())
        print("HTML content saved to debug_search_results.html")
    else:
        print("Failed to get soup object.")
