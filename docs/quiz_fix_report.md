I have optimized the quiz submission process to prevent the "Analysis timed out" error.

**Changes made in `src/app/quiz/page.tsx`:**

1.  **Query Optimization:**
    *   Added a **Gender Filter**: The query now filters perfumes based on the user's selected "protagonist" (gender) preference.
        *   If 'Feminine' is selected, it fetches 'Female' and 'Unisex' perfumes.
        *   If 'Masculine' is selected, it fetches 'Male' and 'Unisex' perfumes.
        *   This avoids fetching irrelevant data (e.g., 'Male' perfumes for a user seeking 'Feminine' scents), significantly reducing the dataset and processing time.
    *   **Reduced Fields**: Removed `occasions`, `best_season`, and `price_tier` from the initial fetch as they are not used in the immediate matching logic, reducing the payload size.

2.  **Increased Timeout:**
    *   Extended the timeout threshold from **15 seconds to 30 seconds** to allow more time for the database to respond, especially on slower connections.

**Verification:**
Please retake the quiz. The "Analysis" step should now complete successfully without timing out. The recommendations will also be more targeted due to the gender filtering at the database level.