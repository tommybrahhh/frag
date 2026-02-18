import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

# Configuration
IMG_DIR = os.path.join("public", "Img")
BATCH_SIZE = 1000

def normalize_filename(name):
    """Normalize a string to match common filename patterns."""
    # Lowercase, replace spaces/dots with hyphens
    return re.sub(r'[\s\.]+', '-', name.lower())

def fix_image_paths():
    print(f"--- Starting Image Integrity Scan ---")
    
    # 1. Index local files
    print(f"Scanning {IMG_DIR}...")
    if not os.path.exists(IMG_DIR):
        print(f"Error: Directory {IMG_DIR} not found.")
        return

    # Map of normalized_name -> real_filename
    # e.g., "dior-sauvage.jpg" -> "Dior-Sauvage.jpg"
    # e.g., "dior-sauvage" -> "Dior-Sauvage.jpg" (for extension agnostic matching)
    local_files = {}
    
    for filename in os.listdir(IMG_DIR):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            # Store exact filename
            local_files[filename] = filename
            local_files[filename.lower()] = filename
            
            # Store normalized version without extension for fuzzy matching
            name_no_ext = os.path.splitext(filename)[0]
            normalized = normalize_filename(name_no_ext)
            local_files[normalized] = filename

    print(f"Indexed {len(local_files)} file keys from local directory.")

    # 2. Connect to DB
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 3. Fetch perfumes
    total_fixed = 0
    total_missing = 0
    offset = 0

    while True:
        print(f"Fetching perfumes (Offset: {offset})...")
        response = supabase.table("perfumes").select("id, name, slug, image_url").range(offset, offset + BATCH_SIZE - 1).execute()
        perfumes = response.data

        if not perfumes:
            break

        updates = []

        for p in perfumes:
            db_image = p.get('image_url')
            
            # Clean up DB path to get just the filename
            # Handles: "pic.jpg", "/Img/pic.jpg", "https://.../pic.jpg"
            if not db_image:
                clean_db_name = ""
            elif "/" in db_image:
                clean_db_name = db_image.split("/")[-1]
            else:
                clean_db_name = db_image

            # 1. Check if the exact file exists (Happy Path)
            if clean_db_name and clean_db_name in local_files:
                continue # All good!

            # 2. If missing or mismatch, try to find a match
            match = None
            
            # Try matching by cleaned DB name
            if clean_db_name and clean_db_name.lower() in local_files:
                match = local_files[clean_db_name.lower()]
            
            # Try matching by Slug
            elif p['slug'] and p['slug'] in local_files:
                match = local_files[p['slug']]
            
            # Try matching by Normalized Slug
            elif p['slug'] and normalize_filename(p['slug']) in local_files:
                match = local_files[normalize_filename(p['slug'])]

            # 3. Update DB if match found
            if match:
                # We found a local file that matches this perfume!
                # Let's standardize the DB entry to just the filename (or /Img/filename)
                # Using just filename is cleaner if getPerfumeImage handles the prefix, 
                # but let's stick to your convention.
                
                # Check if it's actually different before updating
                if clean_db_name != match:
                    # print(f"Fixing: {p['name']} | '{clean_db_name}' -> '{match}'")
                    # updates.append({'id': p['id'], 'image_url': match}) # Bulk update not supported easily in loop
                    
                    supabase.table("perfumes").update({"image_url": match}).eq("id", p['id']).execute()
                    total_fixed += 1
            else:
                # Still missing
                # print(f"Missing: {p['name']} (Slug: {p['slug']})")
                total_missing += 1

        offset += len(perfumes)

    print(f"
--- Scan Complete ---")
    print(f"Fixed/Linked: {total_fixed}")
    print(f"Still Missing: {total_missing}")

if __name__ == "__main__":
    fix_image_paths()
