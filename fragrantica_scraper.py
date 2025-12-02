import requests
from bs4 import BeautifulSoup
import time
import random
import cloudscraper
import re
import csv
from urllib.parse import urlparse





def scrape_fragrantica(url):
    try:
        print("Attempting to bypass Cloudflare protection...")
        
        scraper = cloudscraper.create_scraper()
        time.sleep(random.uniform(2, 5))
        
        print(f"Making request to: {url}")
        
        response = scraper.get(url, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Successfully bypassed Cloudflare protection!")
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Determine the base URL for relative image paths
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

            results = [] # Initialize results here

            # Check if it's a designer page or a perfume detail page
            # Assuming perfume detail pages have a h1 with itemprop="name" and a main image with itemprop="image"
            name_tag_perfume_detail = soup.find('h1', itemprop='name')
            img_tag_perfume_detail = soup.find('img', itemprop='image')
            
            if name_tag_perfume_detail and img_tag_perfume_detail: # Perfume detail page
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

                print(f"Perfume Name: {perfume_name}")
                print(f"Image URL: {image_url}")
                results.append({"name": perfume_name, "image_url": image_url})
                return results, soup 
            else: # Assume it's a designer page (or unknown structure)
                # Look for perfume items - Fragrantica typically uses 'prefumeHbox' class for perfume cards
                perfume_items = soup.find_all('a', class_='prefumeHbox')
                
                print(f"Found {len(perfume_items)} perfume items")
                print("-" * 80)
                
                # Extract and print perfume names and image links
                for i, item in enumerate(perfume_items):
                    # Extract perfume name from aria-label
                    name = item.get('aria-label', 'No name found')
                    
                    # Clean up the name using regex
                    import re
                    name = re.sub(r'Link to Chanel ', '', name).strip() # Specific for Chanel designer page
                    name = re.sub(r'\s*(male|female|unisex)\s*\d{4}\s*', '', name, flags=re.IGNORECASE)
                    name = name.strip()
                    
                    # Find image
                    image_url = 'No image found'
                    img_tag = item.find('img')
                    if img_tag:
                        image_url = img_tag.get('src')
                        # Handle relative URLs if necessary
                        if image_url and image_url.startswith('//'):
                            image_url = 'https:' + image_url
                        elif image_url and image_url.startswith('/'):
                            image_url = base_url + image_url
                    
                    print(f"Item {i+1}:")
                    print(f"Name: {name}")
                    print(f"Image: {image_url}")
                    print("-" * 40)
                    results.append({"name": name, "image_url": image_url})
                return results, soup 
                
        else:
            print(f"Failed to bypass Cloudflare. Status code: {response.status_code}")
            print("Response headers:", dict(response.headers))
            return None, None
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        print("\nAlternative approach: Try using selenium with a real browser")
        return None, None

if __name__ == "__main__":
    input_filename = "perfumes.csv"
    output_filename = "output_perfumes.csv"
    
    all_perfume_data_rows = []
    
    try:
        with open(input_filename, 'r', newline='', encoding='utf-8') as infile:
            reader = csv.reader(infile, delimiter=';')
            header = next(reader) # Read header
            
            # Prepare header for the output file - keep original header for now
            output_header = header 
            all_perfume_data_rows.append(output_header)

            for row_index, row in enumerate(reader):
                if not row:
                    continue
                
                # Make a mutable copy of the row
                current_row = list(row) 

                original_perfume_name = current_row[0].strip() if len(current_row) > 0 else "N/A"
                fragrantica_page_url = current_row[1].strip() if len(current_row) > 1 else ""
                
                fragrantica_name = "" # Initialize
                image_url = ""       # Initialize

                print(f"\n--- Processing: {original_perfume_name} ---")
                
                if fragrantica_page_url:
                    print(f"Using Fragrantica URL: {fragrantica_page_url}")
                    
                    scraped_info, soup_obj = scrape_fragrantica(fragrantica_page_url)
                    
                    if scraped_info:
                        if isinstance(scraped_info, list) and len(scraped_info) > 0:
                            fragrantica_name = scraped_info[0].get("name", "Not Found")
                            image_url = scraped_info[0].get("image_url", "Not Found")
                        elif isinstance(scraped_info, dict):
                            fragrantica_name = scraped_info.get("name", "Not Found")
                            image_url = scraped_info.get("image_url", "Not Found")
                    
                    # Save debug HTML for the last scraped page
                    if soup_obj:
                        with open('debug_fragrantica.html', 'w', encoding='utf-8') as f:
                            f.write(soup_obj.prettify())
                        print("Saved HTML content of the last scraped page to debug_fragrantica.html for inspection")
                else:
                    print(f"No Fragrantica URL provided in CSV for '{original_perfume_name}'. Skipping scraping for this perfume.")
                    fragrantica_name = "URL Not Provided"
                    image_url = "URL Not Provided"

                # Ensure row has enough columns before updating
                while len(current_row) < 4:
                    current_row.append("") # Pad with empty strings

                current_row[2] = fragrantica_name
                current_row[3] = image_url
                all_perfume_data_rows.append(current_row)
                
    except FileNotFoundError:
        print(f"Error: {input_filename} not found.")
        exit()
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

    # Write results to output CSV
    if all_perfume_data_rows:
        with open(output_filename, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.writer(outfile, delimiter=';') # Use semicolon delimiter for output
            writer.writerows(all_perfume_data_rows)
        print(f"\nProcessed data saved to {output_filename}")
    else:
        print("No data processed.")