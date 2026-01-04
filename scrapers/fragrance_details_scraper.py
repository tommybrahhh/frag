import requests
from bs4 import BeautifulSoup
import time
import random
import cloudscraper
import re
import csv
from urllib.parse import urlparse
import sys
import pandas as pd

def scrape_fragrance_details(perfume_url):
    """
    Scrapes detailed information for a single fragrance from its Fragrantica page.
    """
    print(f"Scraping details for: {perfume_url}")
    details = {
        "main_accords": "",
        "sillage": "",
        "longevity": "",
        "price": "", # Price is often external, leaving blank for now
        "gender": "",
        "year": "",
        "concentration": ""
    }

    try:
        scraper = cloudscraper.create_scraper()
        time.sleep(random.uniform(2, 5)) 
        
        response = scraper.get(perfume_url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')

        # Gender
        h1_tag = soup.find('h1', itemprop='name')
        if h1_tag:
            small_tag = h1_tag.find('small')
            if small_tag:
                details['gender'] = small_tag.get_text(strip=True)

        # Main Accords
        accords_div = soup.find('div', class_='accord-box')
        if accords_div:
            accords_list = [p.get_text(strip=True) for p in accords_div.find_all('p')]
            details['main_accords'] = "; ".join(accords_list)


        
        # Sillage and Longevity
        sillage_longevity_container = soup.find('div', class_='grid-x grid-margin-x grid-margin-y')
        if sillage_longevity_container:
            for item in sillage_longevity_container.find_all('h4'):
                if 'Sillage' in item.get_text():
                    sillage_value = item.find_next_sibling('div', class_='small-12 medium-6 text-center').find('div', class_='rating-value')
                    if sillage_value:
                        details['sillage'] = sillage_value.get_text(strip=True)
                elif 'Longevity' in item.get_text():
                    longevity_value = item.find_next_sibling('div', class_='small-12 medium-6 text-center').find('div', class_='rating-value')
                    if longevity_value:
                        details['longevity'] = longevity_value.get_text(strip=True)
                        

        # Year and Concentration (from description paragraph)
        description_p = soup.find('div', itemprop='description')
        if description_p:
            description_text = description_p.get_text()
            # Year
            year_match = re.search(r'was launched in (\d{4})', description_text)
            if year_match:
                details['year'] = year_match.group(1)
            # Concentration (attempt to find common terms)
            concentration_match = re.search(r'(Eau de Parfum|Eau de Toilette|Eau de Cologne|Extrait de Parfum|Parfum)', description_text, re.IGNORECASE)
            if concentration_match:
                details['concentration'] = concentration_match.group(1)


    except requests.exceptions.RequestException as e:
        print(f"Network or request error for {perfume_url}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred for {perfume_url}: {e}")
        import traceback
        traceback.print_exc()
    
    return details


def main():
    if len(sys.argv) < 2:
        print("Usage: python fragrance_details_scraper.py <input_csv_file>")
        sys.exit(1)
    
    input_csv_file = sys.argv[1]
    output_csv_file = input_csv_file.replace(".csv", "_enriched.csv")

    try:
        df = pd.read_csv(input_csv_file)
    except FileNotFoundError:
        print(f"Error: Input file '{input_csv_file}' not found.")
        sys.exit(1)

    all_fragrance_details = []

    for index, row in df.iterrows():
        link = row['link']
        if link:
            perfume_details = scrape_fragrance_details(link)
            combined_details = {**row.to_dict(), **perfume_details}
            all_fragrance_details.append(combined_details)
        else:
            all_fragrance_details.append(row.to_dict()) # Append original row if no link

    if all_fragrance_details:
        output_df = pd.DataFrame(all_fragrance_details)
        output_df.to_csv(output_csv_file, index=False, encoding='utf-8')
        print(f"Successfully enriched data and saved to {output_csv_file}")
    else:
        print("No fragrance details to write.")

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()