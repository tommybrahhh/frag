export interface Database {
  public: {
    Tables: {
      perfumes: {
        Row: {
          id: string
          name: string
          image_url: string | null
          rating: number | null
          vibe_tags: string[] | null
          price_tier: string | null
          best_season: string[] | null
          longevity_rating: number | null
          gender: string | null
          concentration: string | null
          best_time: string | null
          occasions: string[] | null
          olfactory_family: string | null
          brand_id: string | null
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          rating?: number | null
          vibe_tags?: string[] | null
          price_tier?: string | null
          best_season?: string[] | null
          longevity_rating?: number | null
          gender?: string | null
          concentration?: string | null
          best_time?: string | null
          occasions?: string[] | null
          olfactory_family?: string | null
          brand_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          rating?: number | null
          vibe_tags?: string[] | null
          price_tier?: string | null
          best_season?: string[] | null
          longevity_rating?: number | null
          gender?: string | null
          concentration?: string | null
          best_time?: string | null
          occasions?: string[] | null
          olfactory_family?: string | null
          brand_id?: string | null
        }
      }
      user_collections: {
        Row: {
          id: string
          user_id: string
          perfume_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          perfume_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          perfume_id?: string
          created_at?: string
        }
      }
    }
  }
}