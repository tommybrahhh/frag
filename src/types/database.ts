export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      notes: {
        Row: {
          id: string
          name: string
          description: string | null
          family: string | null
          color_hex: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          family?: string | null
          color_hex?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          family?: string | null
          color_hex?: string | null
        }
      }
      perfume_notes: {
        Row: {
          perfume_id: string
          note_id: string
          type: string
        }
        Insert: {
          perfume_id: string
          note_id: string
          type: string
        }
        Update: {
          perfume_id?: string
          note_id?: string
          type?: string
        }
      }
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
          sillage_rating: number | null
          gender: string | null
          concentration: string | null
          best_time: string | null
          occasions: string[] | null
          olfactory_family: string | null
          brand_id: string | null
          perfumer: string | null
          scenario: string | null
          scent_profile: Record<string, number> | null
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
          sillage_rating?: number | null
          gender?: string | null
          concentration?: string | null
          best_time?: string | null
          occasions?: string[] | null
          olfactory_family?: string | null
          brand_id?: string | null
          perfumer?: string | null
          scenario?: string | null
          scent_profile?: Record<string, number> | null
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
          sillage_rating?: number | null
          gender?: string | null
          concentration?: string | null
          best_time?: string | null
          occasions?: string[] | null
          olfactory_family?: string | null
          brand_id?: string | null
          perfumer?: string | null
          scenario?: string | null
          scent_profile?: Record<string, number> | null
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
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
