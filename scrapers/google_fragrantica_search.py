import requests
from bs4 import BeautifulSoup
import re
import time
import random
from urllib.parse import quote_plus
import cloudscraper

def search_google_for_fragrantica(perfume_name):
    """
    Search Google for a perfume name and return the first Fragrantica URL found
    """
    try:
        # Format the search query
        search_query = f"{perfume_name} site:fragrantica.es OR site:fragrantica.com"
        encoded_query = quote_plus(search_query)
        
        # Google search URL
        url = f"https://www.google.com/search?q={encoded_query}"
        
        # Use cloudscraper to bypass bot detection
        scraper = cloudscraper.create_scraper()
        
        # Set headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        }
        
        # Add random delay to avoid being blocked
        time.sleep(random.uniform(2, 5))
        
        # Make the request with cloudscraper
        response = scraper.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Debug: Save HTML for inspection
            with open('google_search_debug.html', 'w', encoding='utf-8') as f:
                f.write(soup.prettify())
            
            # Find all search result links - Google uses h3 tags with parent links
            search_results = soup.find_all('h3')
            
            # Look for Fragrantica URLs in the parent links
            fragrantica_pattern = re.compile(r'https?://(?:www\.)?fragrantica\.(?:es|com)/perfume/')
            
            for result in search_results:
                parent_link = result.find_parent('a', href=True)
                if parent_link:
                    href = parent_link.get('href')
                    if href and fragrantica_pattern.search(href):
                        # Extract the actual URL from Google's redirect
                        if href.startswith('/url?q='):
                            # Parse Google's redirect URL
                            actual_url = href.split('/url?q=')[1].split('&')[0]
                            actual_url = requests.utils.unquote(actual_url)
                            return actual_url
                        else:
                            return href
            
            # Alternative approach: search for all links
            links = soup.find_all('a', href=True)
            for link in links:
                href = link.get('href')
                if href and fragrantica_pattern.search(href):
                    if href.startswith('/url?q='):
                        actual_url = href.split('/url?q=')[1].split('&')[0]
                        actual_url = requests.utils.unquote(actual_url)
                        return actual_url
                    else:
                        return href
            
            print(f"No Fragrantica URL found for: {perfume_name}")
            print("Check google_search_debug.html for the search results")
            return None
            
        else:
            print(f"Google search failed with status code: {response.status_code}")
            print(f"Response text: {response.text[:500]}...")
            return None
            
    except Exception as e:
        print(f"Error searching for {perfume_name}: {e}")
        import traceback
        traceback.print_exc()
        return None

def search_multiple_perfumes(perfume_names):
    """
    Search for multiple perfume names and return results
    """
    results = {}
    
    for perfume_name in perfume_names:
        print(f"Searching for: {perfume_name}")
        fragrantica_url = search_google_for_fragrantica(perfume_name)
        results[perfume_name] = fragrantica_url
        print(f"Result: {fragrantica_url}")
        print("-" * 50)
    
    return results

def main():
    # Test with the provided examples
    test_perfumes = [
        "Nomade Eau de Parfum Chloé",
        "Pure Musc For Her Narciso Rodriguez"
    ]
    
    print("Starting Google search for Fragrantica URLs...")
    print("=" * 60)
    
    results = search_multiple_perfumes(test_perfumes)
    
    print("\nFinal Results:")
    print("=" * 60)
    for perfume, url in results.items():
        print(f"{perfume}: {url}")

if __name__ == "__main__":
    main()