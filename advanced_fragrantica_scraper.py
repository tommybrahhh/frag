import requests
from bs4 import BeautifulSoup
import time
import random
import cloudscraper
import re
import csv
from urllib.parse import urlparse
import json
from datetime import datetime
import logging
import socket
import socks
from fake_useragent import UserAgent
import stem.process
from stem import Signal
from stem.control import Controller
import os
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)

class AdvancedFragranticaScraper:
    def __init__(self):
        self.session = None
        self.scraper = None
        self.current_proxy = None
        self.proxy_list = self._get_proxy_list()
        self.user_agent_rotator = UserAgent()
        self.request_count = 0
        self.last_request_time = 0
        self.tor_process = None
        self.tor_controller = None
        
    def _get_proxy_list(self):
        """Get a list of potential proxies (free public proxies)"""
        # This is a basic list - consider using paid proxy services for better reliability
        return [
            # Add your proxy servers here in format: 'http://user:pass@ip:port'
            # Example: 'http://user:pass@123.45.67.89:8080'
        ]
    
    def _setup_tor(self):
        """Setup Tor proxy for anonymous requests"""
        try:
            # Configure Tor
            tor_cmd = 'tor'
            tor_config = {
                'SocksPort': '9050',
                'ControlPort': '9051',
                'DataDirectory': '/tmp/tor-data'
            }
            
            self.tor_process = stem.process.launch_tor_with_config(
                config=tor_config,
                tor_cmd=tor_cmd,
                take_ownership=True
            )
            
            self.tor_controller = Controller.from_port(port=9051)
            self.tor_controller.authenticate()
            return True
        except Exception as e:
            logging.warning(f"Tor setup failed: {e}")
            return False
    
    def _rotate_tor_ip(self):
        """Rotate Tor IP address"""
        if self.tor_controller:
            try:
                self.tor_controller.signal(Signal.NEWNYM)
                time.sleep(5)  # Wait for new circuit
                return True
            except Exception as e:
                logging.warning(f"Tor IP rotation failed: {e}")
                return False
        return False
    
    def _get_random_proxy(self):
        """Get a random proxy from the list"""
        if self.proxy_list:
            return random.choice(self.proxy_list)
        return None
    
    def _get_random_user_agent(self):
        """Get a random user agent"""
        return self.user_agent_rotator.random
    
    def _throttle_requests(self):
        """Implement intelligent request throttling"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # Variable delay based on request frequency
        if self.request_count > 10:
            # After 10 requests, increase delay
            min_delay = 15
            max_delay = 30
        elif self.request_count > 5:
            # After 5 requests, moderate delay
            min_delay = 10
            max_delay = 20
        else:
            # Initial requests with shorter delay
            min_delay = 5
            max_delay = 15
        
        # Add jitter to make pattern less predictable
        jitter = random.uniform(0.5, 2.0)
        delay = random.uniform(min_delay, max_delay) * jitter
        
        if time_since_last < delay:
            sleep_time = delay - time_since_last
            logging.info(f"Throttling: Sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def _create_session_with_retry(self):
        """Create a session with retry logic"""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=100, pool_maxsize=100)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def _bypass_cloudflare_advanced(self, url, max_retries=3):
        """Advanced Cloudflare bypass with multiple strategies"""
        for attempt in range(max_retries):
            try:
                self._throttle_requests()
                
                # Strategy 1: Use cloudscraper with random user agent
                scraper = cloudscraper.create_scraper(
                    browser={
                        'browser': 'chrome',
                        'platform': 'windows',
                        'mobile': False,
                        'custom': self._get_random_user_agent()
                    }
                )
                
                # Add headers to mimic browser behavior
                headers = {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0',
                    'DNT': '1'
                }
                
                logging.info(f"Attempt {attempt + 1}: Making request to {url}")
                
                response = scraper.get(
                    url, 
                    headers=headers,
                    timeout=30,
                    allow_redirects=True
                )
                
                logging.info(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    logging.info("Successfully bypassed Cloudflare protection!")
                    return response, scraper
                
                # If blocked, try different strategies
                if response.status_code in [403, 429, 503]:
                    logging.warning(f"Blocked with status {response.status_code}. Trying alternative strategy...")
                    
                    # Strategy 2: Try with different headers
                    headers['User-Agent'] = self._get_random_user_agent()
                    response = scraper.get(url, headers=headers, timeout=30)
                    
                    if response.status_code == 200:
                        return response, scraper
                    
                    # Strategy 3: Try with proxy if available
                    proxy = self._get_random_proxy()
                    if proxy:
                        logging.info(f"Trying with proxy: {proxy}")
                        proxies = {'http': proxy, 'https': proxy}
                        response = scraper.get(url, headers=headers, proxies=proxies, timeout=30)
                        
                        if response.status_code == 200:
                            return response, scraper
                
                time.sleep(random.uniform(10, 20))  # Wait before retry
                
            except Exception as e:
                logging.error(f"Attempt {attempt + 1} failed: {e}")
                time.sleep(random.uniform(15, 30))
        
        return None, None
    
    def scrape_fragrantica(self, url):
        """Advanced scraping function with multiple fallback strategies"""
        try:
            response, scraper = self._bypass_cloudflare_advanced(url)
            
            if not response or response.status_code != 200:
                logging.error("Failed to bypass Cloudflare after multiple attempts")
                return None, None
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Determine the base URL for relative image paths
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            
            results = []
            
            # Check if it's a designer page or a perfume detail page
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
                
                results.append({"name": perfume_name, "image_url": image_url})
                return results, soup
            
            else:
                # Handle designer pages or other structures
                perfume_items = soup.find_all('a', class_='prefumeHbox')
                logging.info(f"Found {len(perfume_items)} perfume items")
                
                for i, item in enumerate(perfume_items):
                    name = item.get('aria-label', 'No name found')
                    name = re.sub(r'Link to Chanel ', '', name).strip()
                    name = re.sub(r'\s*(male|female|unisex)\s*\d{4}\s*', '', name, flags=re.IGNORECASE)
                    name = name.strip()
                    
                    image_url = 'No image found'
                    img_tag = item.find('img')
                    if img_tag:
                        image_url = img_tag.get('src')
                        if image_url and image_url.startswith('//'):
                            image_url = 'https:' + image_url
                        elif image_url and image_url.startswith('/'):
                            image_url = base_url + image_url
                    
                    results.append({"name": name, "image_url": image_url})
                
                return results, soup
                
        except Exception as e:
            logging.error(f"Error during scraping: {e}")
            import traceback
            traceback.print_exc()
            return None, None
    
    def process_csv(self, input_filename="perfumes.csv", output_filename="output_perfumes.csv"):
        """Process the CSV file with enhanced scraping"""
        all_perfume_data_rows = []
        
        try:
            with open(input_filename, 'r', newline='', encoding='latin-1') as infile:
                reader = csv.reader(infile, delimiter=';')
                header = next(reader)
                
                output_header = header 
                all_perfume_data_rows.append(output_header)
                
                for row_index, row in enumerate(reader):
                    if not row:
                        continue
                    
                    current_row = list(row)
                    original_perfume_name = current_row[0].strip() if len(current_row) > 0 else "N/A"
                    fragrantica_page_url = current_row[1].strip() if len(current_row) > 1 else ""
                    
                    fragrantica_name = ""
                    image_url = ""
                    
                    logging.info(f"\n--- Processing: {original_perfume_name} ---")
                    
                    if fragrantica_page_url:
                        logging.info(f"Using Fragrantica URL: {fragrantica_page_url}")
                        
                        scraped_info, soup_obj = self.scrape_fragrantica(fragrantica_page_url)
                        
                        if scraped_info:
                            if isinstance(scraped_info, list) and len(scraped_info) > 0:
                                fragrantica_name = scraped_info[0].get("name", "Not Found")
                                image_url = scraped_info[0].get("image_url", "Not Found")
                            elif isinstance(scraped_info, dict):
                                fragrantica_name = scraped_info.get("name", "Not Found")
                                image_url = scraped_info.get("image_url", "Not Found")
                        
                        # Save debug HTML
                        if soup_obj:
                            with open('debug_fragrantica.html', 'w', encoding='utf-8') as f:
                                f.write(soup_obj.prettify())
                            logging.info("Saved HTML content for inspection")
                    else:
                        logging.info(f"No URL provided for '{original_perfume_name}'")
                        fragrantica_name = "URL Not Provided"
                        image_url = "URL Not Provided"
                    
                    # Ensure row has enough columns
                    while len(current_row) < 4:
                        current_row.append("")
                    
                    current_row[2] = fragrantica_name
                    current_row[3] = image_url
                    all_perfume_data_rows.append(current_row)
                    
                    # Save progress every 10 rows
                    if (row_index + 1) % 10 == 0:
                        self._save_progress(all_perfume_data_rows, output_filename)
                        logging.info(f"Saved progress after {row_index + 1} rows")
                    
                    # Rotate IP every 20 requests if using Tor
                    if self.request_count % 20 == 0 and self.tor_controller:
                        self._rotate_tor_ip()
                        
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
    # Initialize the advanced scraper
    scraper = AdvancedFragranticaScraper()
    
    # Try to setup Tor for additional anonymity
    tor_success = scraper._setup_tor()
    if tor_success:
        logging.info("Tor proxy setup successful")
    else:
        logging.info("Using direct connections (Tor not available)")
    
    # Process the CSV
    scraper.process_csv()