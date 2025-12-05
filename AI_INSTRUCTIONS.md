# AI Agent Instructions: Fragrantica URL Search

## QUICK EXECUTION COMMANDS:

1. **INSTALL DEPENDENCIES**:
```bash
pip install selenium
```

2. **RUN BULK SEARCH**:
```bash
python bulk_fragrantica_search.py
```

## WHAT IT DOES:
- Reads perfume names from `search.csv` (column A)
- Searches Google for each perfume's Fragrantica URL
- Saves results to `fragrantica_results.csv` (name + URL)

## FILES:
- `search.csv` - Input file with perfume names
- `bulk_fragrantica_search.py` - Main script to execute
- `fragrantica_results.csv` - Output file with results

## EXPECTED OUTPUT:
Script will show progress for each perfume and create CSV with:
- Column A: Perfume Name
- Column B: Fragrantica URL

## NOTES:
- Requires Chrome browser installed
- Internet connection needed
- Takes 2-3 seconds per perfume