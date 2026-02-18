import csv
import os
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://fmtqqpnhnexwmgpeaidb.supabase.co"
SUPABASE_KEY = "sb_secret_W69EUxa1r_tyHgR7OkKqMg_yTTzPm51" # Paste your service_role key

CSV_FILE = "data/perfumes.csv"

def debug_slug_matching():
    print("--- 1. Connecting to Supabase ---")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Fetch ALL slugs from the database to compare in memory
        print("Fetching all slugs from DB...")
        response = supabase.table("perfumes").select("slug").execute()
        
        # Create a set of DB slugs for fast searching
        db_slugs = {row['slug'] for row in response.data if row['slug']}
        print(f"Database contains {len(db_slugs)} perfumes.")
        
        # Also create a lowercase version map to check for casing issues
        db_slugs_lower = {s.lower(): s for s in db_slugs}
        
    except Exception as e:
        print(f"Connection Error: {e}")
        return

    print("\n--- 2. Reading CSV File ---")
    if not os.path.exists(CSV_FILE):
        print(f"File not found: {CSV_FILE}")
        return

    csv_slugs = []
    # Read CSV with latin-1 encoding as per your file
    with open(CSV_FILE, 'r', encoding='latin-1', errors='replace') as f:
        reader = csv.reader(f, delimiter=';')
        for row in reader:
            if not row or len(row) < 2: continue
            
            # Normalize CSV slug
            slug = row[0].strip().replace('\r', '').replace('\n', '')
            
            # Skip header lines
            if "source:" in slug or slug == "perfume": continue
            
            if slug:
                csv_slugs.append(slug)

    print(f"CSV contains {len(csv_slugs)} slugs to check.")

    print("\n--- 3. COMPARISON RESULTS ---")
    print(f"{'CSV SLUG (What we have)':<40} | {'DB STATUS (What we found)':<30}")
    print("-" * 75)

    matches = 0
    casing_issues = 0
    not_found = 0
    
    # Check first 20 items to avoid flooding console
    for i, slug in enumerate(csv_slugs):
        if i >= 20: 
            print("... (skipping the rest of the list) ...")
            break
            
        if slug in db_slugs:
            print(f"{slug:<40} | ✅ EXACT MATCH")
            matches += 1
        elif slug.lower() in db_slugs_lower:
            real_slug = db_slugs_lower[slug.lower()]
            print(f"{slug:<40} | ⚠️ CASE MISMATCH (DB: '{real_slug}')")
            casing_issues += 1
        else:
            print(f"{slug:<40} | ❌ NOT FOUND IN DB")
            not_found += 1

    print("-" * 75)
    print(f"Summary (First 20): {matches} Matches, {casing_issues} Casing Issues, {not_found} Not Found.")

if __name__ == "__main__":
    debug_slug_matching()