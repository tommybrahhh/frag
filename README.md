# Fragrantica URL Search Script

This script automatically searches Google for perfume names and extracts their corresponding Fragrantica URLs.

## Prerequisites

- Python 3.7+
- Chrome browser installed
- Internet connection

## Installation

1. Install required dependencies:
```bash
pip install selenium
```

## Usage Instructions

### 1. Prepare Input File
Create a CSV file named `search.csv` with perfume names in column A:
```
Name
Perfume Name 1
Perfume Name 2
Perfume Name 3
...
```

### 2. Run the Script
Execute the bulk processing script:
```bash
python bulk_fragrantica_search.py
```

### 3. View Results
The results will be saved to `fragrantica_results.csv` with:
- Column A: Perfume Name
- Column B: Fragrantica URL

## Authentication Timeout Configuration

The authentication system now includes configurable timeout settings to improve reliability:

- **Environment Variable**: `NEXT_PUBLIC_AUTH_TIMEOUT`
- **Default Value**: 15000 (15 seconds)
- **Recommended Settings**:
  - Local Development: 15000 (15 seconds)
  - Production: 10000 (10 seconds)
  
The timeout setting controls:
1. Maximum wait time for authentication requests
2. Network request timeout duration
3. Retry mechanism with exponential backoff

Error handling improvements include:
- Clear timeout error messages
- Automatic retries for failed requests
- Graceful fallback when network issues occur

## Script Files

- [`bulk_fragrantica_search.py`](bulk_fragrantica_search.py) - Main bulk processing script
- [`selenium_fragrantica_search.py`](selenium_fragrantica_search.py) - Individual search script
- [`google_fragrantica_search.py`](google_fragrantica_search.py) - Alternative method (may be blocked by Google)
- [`fragrantica_brand_scraper.py`](fragrantica_brand_scraper.py) - Scrapes all perfumes for a given brand URL or name.

## Fragrantica Brand Scraper Usage

To scrape all perfumes for a specific brand, use the `fragrantica_brand_scraper.py` script.

### Usage:
```bash
python fragrantica_brand_scraper.py <brand_name_or_url>
```
- Replace `<brand_name_or_url>` with the full URL of the brand's page on Fragrantica (e.g., `https://www.fragrantica.com/designers/Maison-Martin-Margiela.html`) or the brand name (e.g., `Maison Martin Margiela`).

### Example:
```bash
python fragrantica_brand_scraper.py https://www.fragrantica.com/designers/Maison-Martin-Margiela.html
```
This will generate a CSV file named `maison_martin_margiela_fragrances.csv` (or similar, based on the brand name) containing details of all perfumes from that brand.

## Features

- ✅ Automatically processes CSV files
- ✅ Bypasses Google bot detection using Selenium
- ✅ Shows real-time progress
- ✅ Handles special characters and encoding
- ✅ Saves results to CSV format

## Example Output

The script will output progress like:
```
Processing 1/33: My Way Parfum Giorgio Armani
Result: https://www.fragrantica.es/perfume/Giorgio-Armani/My-Way-Parfum-78561.html
```

## Notes

- The script may take several minutes to process large lists due to Google rate limiting
- Ensure Chrome browser is installed and updated
- For best results, run on a stable internet connection
