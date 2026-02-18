import csv
import time
import os
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://fmtqqpnhnexwmgpeaidb.supabase.co"
# IMPORTANT: Use your 'service_role' key (revealed in Settings > API)
SUPABASE_KEY = "xxx"

# Path to your CSV file
CSV_FILE = "data/perfumes.csv"
# The column name you created in the perfumes table
TARGET_COLUMN = "fragrantica_url" 

def sync_fragrantica_links():
    print("--- Starting Link Synchronization (English Version) ---")
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Connection error: {e}")
        return

    if not os.path.exists(CSV_FILE):
        print(f"Error: CSV file not found at {CSV_FILE}")
        return

    updates = []
    print(f"Reading data from {CSV_FILE}...")
    
    # Using latin-1 as per your file format
    with open(CSV_FILE, 'r', encoding='latin-1', errors='replace') as f:
        # Using semicolon as the delimiter
        reader = csv.reader(f, delimiter=';')
        
        for row in reader:
            if not row or len(row) < 2:
                continue
            
            # NORMALIZATION: strip whitespace, remove hidden line breaks, and lowercase
            slug = row[0].strip().replace('\r', '').replace('\n', '').lower()
            url = row[1].strip()
            
            # Skip metadata or header lines
            if "source:" in slug or slug == "perfume":
                continue

            if slug and url.startswith("http"):
                updates.append({'slug': slug, 'url': url})

    print(f"Processing {len(updates)} links...")
    
    count_ok = 0
    count_fail = 0
    failed_slugs = []

    for i, item in enumerate(updates):
        slug = item['slug']
        url = item['url']

        try:
            # Attempt to update the row where the slug matches
            response = supabase.table("perfumes")\
                .update({TARGET_COLUMN: url})\
                .eq("slug", slug)\
                .execute()
            
            if response.data and len(response.data) > 0:
                count_ok += 1
            else:
                count_fail += 1
                # Store up to 3 failed slugs for debugging
                if len(failed_slugs) < 3:
                    failed_slugs.append(slug)
        
        except Exception as e:
            print(f"Error updating slug '{slug}': {e}")
            count_fail += 1

    print(f"\nSynchronization Finished.")
    print(f"Successfully Updated: {count_ok}")
    print(f"Failed / Not Found: {count_fail}")

    if count_fail > 0:
        print("\n--- DEBUGGING TIPS ---")
        print("The script could not find matches for these slugs in your database:")
        for s in failed_slugs:
            print(f" - '{s}'")
        print("\nPossible solutions:")
        print("1. Ensure the 'slug' column in Supabase contains these exact strings.")
        print(f"2. Ensure the column '{TARGET_COLUMN}' exists in your perfumes table.")

if __name__ == "__main__":
    sync_fragrantica_links()