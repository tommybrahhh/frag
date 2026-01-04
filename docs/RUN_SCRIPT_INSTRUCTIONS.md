# Simple Instructions to Run the Fragrantica Scraper Script

## Quick Start

### 1. Install Required Dependencies
```bash
pip install cloudscraper beautifulsoup4 pandas
```

### 2. Prepare Your Input File
Create a CSV file named `perfumes.csv` with this format:
```
perfume;url
Perfume Name 1;https://www.fragrantica.com/perfume/Brand/Perfume-12345.html
Perfume Name 2;https://www.fragrantica.es/perfume/Brand/Perfume-67890.html
...
```

### 3. Run the Script
```bash
python fragrantica_scraper.py
```

## What the Script Does

1. **Reads** your `perfumes.csv` file
2. **Processes** each perfume row by row
3. **Scrapes** data from Fragrantica URLs
4. **Extracts**:
   - Official perfume name from `<h1 itemprop="name">`
   - Main image URL from `<img itemprop="image">`
5. **Saves** results to `output_perfumes.csv`

## Output Format
The script creates `output_perfumes.csv` with:
```
perfume;url;perfume_name;perfume_link
Original Name;Fragrantica URL;Scraped Name;Image URL
```

## Handling Rate Limits
- If you get Cloudflare 429 errors, wait a few minutes and run again
- The script will skip failed URLs and continue processing
- Failed entries will have empty fields for later retry

## Tips for Success
- Ensure your CSV uses semicolon (;) as delimiter
- Make sure Fragrantica URLs are valid and accessible
- Run the script during off-peak hours to avoid rate limiting
- Check `debug_fragrantica.html` for the last scraped page content

## Running Multiple Times
The script is designed to be run multiple times:
- It will process only unprocessed perfumes
- Already processed entries are preserved
- Failed entries can be retried by running again

```bash
# Run as many times as needed
python fragrantica_scraper.py
python fragrantica_scraper.py
python fragrantica_scraper.py
```

## Troubleshooting
- If you get import errors: `pip install cloudscraper beautifulsoup4 pandas`
- If URLs fail: Check they're valid Fragrantica links
- If Cloudflare blocks: Wait and try again later