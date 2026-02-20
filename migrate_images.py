import os
import requests
import time
from supabase import create_client, Client

# --- CONFIGURATION ---
SUPABASE_URL = "https://fmtqqpnhnexwmgpeaidb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdHFxcG5obmV4d21ncGVhaWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgwMDA2NSwiZXhwIjoyMDc5Mzc2MDY1fQ.6g0jCHqH8whq97lBUPMoAa8w7R2ES4iM4tJM9ytb8BE"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.")
    exit(1)

# Name of your Supabase Storage Bucket
BUCKET_NAME = "perfumes" 

def migrate_images():
    print(f"Connecting to Supabase at {SUPABASE_URL}...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return

    total_migrated = 0
    batch_size = 1000

    while True:
        print("\n--- Fetching next batch of perfumes with Fragrantica images ---")
        
        # Fetch up to 1000 perfumes that STILL have 'fimgs' in their URL
        try:
            response = supabase.table("perfumes")\
                .select("id, slug, image_url")\
                .ilike("image_url", "%fimgs%")\
                .limit(batch_size)\
                .execute()
            
            perfumes = response.data
        except Exception as e:
            print(f"Error fetching data: {e}")
            return

        # STOP CONDITION: If no perfumes match, we are done!
        if not perfumes:
            print("No more perfumes found with 'fimgs' in the URL.")
            print("Migration Complete!")
            break

        print(f"Found {len(perfumes)} images in this batch. (Total processed so far: {total_migrated})")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.fragrantica.com/'
        }

        for i, perfume in enumerate(perfumes):
            old_url = perfume.get('image_url')
            slug = perfume.get('slug')
            pid = perfume.get('id')
            
            if not old_url:
                continue

            print(f"[{total_migrated + i + 1}] Processing: {slug}")

            try:
                # 1. Download from Fragrantica
                img_response = requests.get(old_url, headers=headers, timeout=15)
                
                if img_response.status_code == 200:
                    content_type = img_response.headers.get('content-type', 'image/jpeg')
                    if 'png' in content_type: ext = 'png'
                    elif 'webp' in content_type: ext = 'webp'
                    else: ext = 'jpg'
                    
                    filename = f"{slug}.{ext}"

                    # 2. Upload to Supabase Storage
                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=filename,
                        file=img_response.content,
                        file_options={"content-type": content_type, "upsert": "true"}
                    )

                    # 3. Get Public URL
                    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
                    
                    # 4. Update Database
                    supabase.table("perfumes").update({"image_url": public_url}).eq("id", pid).execute()
                    
                    print(f"   -> Success")
                
                else:
                    print(f"   -> Download Failed (Status {img_response.status_code})")

            except Exception as e:
                print(f"   -> Error: {str(e)}")
            
            # Polite delay
            time.sleep(1.2)
        
        # Update counter for the next loop
        total_migrated += len(perfumes)

if __name__ == "__main__":
    migrate_images()