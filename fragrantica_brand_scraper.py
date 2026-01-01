import requests
from bs4 import BeautifulSoup
import time
import random
import cloudscraper
import re
import csv
from urllib.parse import urlparse
import sys

def scrape_brand_fragrances(brand_name):
    """
    Scrapes Fragrantica for all fragrances of a given brand and returns their names and links.
    """
    # Format brand name for URL (e.g., "Mith" -> "Mith")
    formatted_brand_name = brand_name.replace(" ", "-").replace("&", "and") # Simple formatting

    url = f"https://www.fragrantica.com/designers/{formatted_brand_name}.html"
    print(f"Attempting to scrape: {url}")

    try:
        scraper = cloudscraper.create_scraper()
        time.sleep(random.uniform(5, 10)) # Random delay for bot protection
        
        
        retries = 3
        for i in range(retries):
            try:
                response = scraper.get(url, timeout=30)
                response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
                break # If successful, break the loop
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:
                    print(f"Rate limited (429). Retrying in {2**(i+1)} seconds...")
                    time.sleep(2**(i+1) + random.uniform(0, 2)) # Exponential backoff with jitter
                else:
                    raise # Re-raise for other HTTP errors
            except requests.exceptions.RequestException as e:
                print(f"Network or request error on attempt {i+1}/{retries}: {e}")
                if i < retries - 1:
                    time.sleep(2**(i+1) + random.uniform(0, 2)) # Exponential backoff with jitter
                else:
                    raise # Re-raise if last attempt
        else:
            print(f"Failed to retrieve data for {brand_name} after {retries} attempts due to persistent errors.")
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

        fragrances = []
        seen_links = set()

        perfume_items = soup.find_all('a', class_='prefumeHbox')
        
        if not perfume_items:
            print(f"No perfume items found for brand: {brand_name}. Check the URL and class names.")
            return []

        print(f"Found {len(perfume_items)} potential perfume items.")

        for item in perfume_items:
            link = item.get('href', '')
            if link and link.startswith('/'):
                link = base_url + link
            
            if link in seen_links:
                continue
            seen_links.add(link)

            name = item.get('aria-label', '')
            # Clean up the name
            name = re.sub(r'Link to ', '', name, flags=re.IGNORECASE)
            name = re.sub(r'\s*(male|femenino|unisex)\s*\d{4}\s*', '', name, flags=re.IGNORECASE)
            name = name.replace(brand_name + " ", "", 1) # Remove brand name prefix once
            name = name.strip()
            
            # Extract ID from the link for image URL
            match = re.search(r'-(\d+)\.html$', link)
            image_id = match.group(1) if match else None
            
            image_url = f"https://fimgs.net/mdimg/perfume-thumbs/375x500.{image_id}.jpg" if image_id else ""
            
            fragrances.append({"name": name, "link": link, "image_url": image_url})
            
        return fragrances
                
    except requests.exceptions.RequestException as e:
        print(f"Network or request error: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()
        return []



def write_to_csv(data, filename):
    """
    Writes a list of dictionaries to a CSV file.
    """
    if not data:
        print("No data to write to CSV.")
        return

    keys = data[0].keys()
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as output_file:
            dict_writer = csv.DictWriter(output_file, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(data)
        print(f"Successfully wrote data to {filename}")
    except IOError as e:
        print(f"Error writing to CSV file {filename}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fragrantica_brand_scraper.py <brand_name_or_url>")
        sys.exit(1)
    
    input_arg = sys.argv[1]
    
    brand_name_for_scraping = ""
    if input_arg.startswith("http://") or input_arg.startswith("https://"):
        parsed_url = urlparse(input_arg)
        path_segments = parsed_url.path.split('/')
        # The brand name is usually the last segment before .html
        if path_segments and path_segments[-1].endswith(".html"):
            brand_name_url_part = path_segments[-1].replace(".html", "")
            brand_name_for_scraping = brand_name_url_part.replace("-", " ") # Convert back to readable name for function
        else:
            print(f"Could not extract brand name from URL: {input_arg}")
            sys.exit(1)
    else:
        brand_name_for_scraping = input_arg
    
    print(f"Starting scraping for brand: {brand_name_for_scraping}")
    fragrances_list = scrape_brand_fragrances(brand_name_for_scraping)

    if fragrances_list:
        output_csv_filename = f"{brand_name_for_scraping.lower().replace(' ', '_')}_fragrances.csv"
        write_to_csv(fragrances_list, output_csv_filename)
    else:
        print(f"No fragrances retrieved for {brand_name_for_scraping}.")

