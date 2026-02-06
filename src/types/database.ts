export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Enums: {
      brand_tier_type: "Designer" | "Niche" | "Indie" | "Celebrity" | "Historical"
      concentration_type: "EDT" | "EDP" | "Parfum" | "Extrait" | "Cologne"
      gender_type: "Male" | "Female" | "Unisex"
      note_position_type: "Top" | "Heart" | "Base"
    }
    Tables: {
      brands: {
        Row: {
          brand_color: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          tier: Database["public"]["Enums"]["brand_tier_type"]
          website_url: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          tier?: Database["public"]["Enums"]["brand_tier_type"]
          website_url?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          tier?: Database["public"]["Enums"]["brand_tier_type"]
          website_url?: string | null
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          image_url: string | null
          is_published: boolean
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          excerpt?: string | null
          image_url?: string | null
          is_published?: boolean
          author_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          image_url?: string | null
          is_published?: boolean
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          perfume_id: string
          content: string
          user_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          perfume_id: string
          content: string
          user_name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          perfume_id?: string
          content?: string
          user_name?: string
          created_at?: string
        }
      }
      notes: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          default_intensity: number | null
          family: string | null
          id: string
          name: string
          volatility: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          default_intensity?: number | null
          family?: string | null
          id?: string
          name: string
          volatility?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          default_intensity?: number | null
          family?: string | null
          id?: string
          name?: string
          volatility?: string | null
        }
      }
      perfume_notes: {
        Row: {
          id: string
          note_id: string
          perfume_id: string
          prominence_score: number | null
          type: Database["public"]["Enums"]["note_position_type"]
        }
        Insert: {
          id?: string
          note_id: string
          perfume_id: string
          prominence_score?: number | null
          type: Database["public"]["Enums"]["note_position_type"]
        }
        Update: {
          id?: string
          note_id?: string
          perfume_id?: string
          prominence_score?: number | null
          type?: Database["public"]["Enums"]["note_position_type"]
        }
      }
      perfumes: {
        Row: {
          best_season: string[] | null
          best_time: string | null
          brand_id: string | null
          concentration: Database["public"]["Enums"]["concentration_type"] | null
          created_at: string | null
          embedding: string | null // Assuming 'vector' type can be represented as string for now
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          image_url: string | null
          longevity_rating: number | null
          name: string
          occasions: string[] | null
          olfactory_family: string[] | null // Updated from text[] to string[]
          perfumer: string | null
          price_tier: string | null
          rating: number | null
          release_year: number | null
          scenario: string | null
          scent_profile: Json | null // Changed from Record<string, number> to Json
          sillage_rating: number | null
          vibe_tags: string[] | null
          slug: string | null
        }
        Insert: {
          best_season?: string[] | null
          best_time?: string | null
          brand_id?: string | null
          concentration?: Database["public"]["Enums"]["concentration_type"] | null
          created_at?: string | null
          embedding?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          image_url?: string | null
          longevity_rating?: number | null
          name: string
          occasions?: string[] | null
          olfactory_family?: string[] | null
          perfumer?: string | null
          price_tier?: string | null
          rating?: number | null
          release_year?: number | null
          scenario?: string | null
          scent_profile?: Json | null
          sillage_rating?: number | null
          vibe_tags?: string[] | null
          slug?: string | null
        }
        Update: {
          best_season?: string[] | null
          best_time?: string | null
          brand_id?: string | null
          concentration?: Database["public"]["Enums"]["concentration_type"] | null
          created_at?: string | null
          embedding?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          image_url?: string | null
          longevity_rating?: number | null
          name?: string
          occasions?: string[] | null
          olfactory_family?: string[] | null
          perfumer?: string | null
          price_tier?: string | null
          rating?: number | null
          release_year?: number | null
          scenario?: string | null
          scent_profile?: Json | null
          sillage_rating?: number | null
          vibe_tags?: string[] | null
          slug?: string | null
        }
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          favorite_notes: string[] | null
          id: string
          signature_scent_id: string | null
          updated_at: string | null
          vibe_tags: string[] | null
          best_season: string | null
          avatar_url: string | null
          is_verified: boolean | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_notes?: string[] | null
          id: string
          signature_scent_id?: string | null
          updated_at?: string | null
          vibe_tags?: string[] | null
          best_season?: string | null
          avatar_url?: string | null
          is_verified?: boolean | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_notes?: string[] | null
          id?: string
          signature_scent_id?: string | null
          updated_at?: string | null
          vibe_tags?: string[] | null
          best_season?: string | null
          avatar_url?: string | null
          is_verified?: boolean | null
        }
      }
      user_collections: {
        Row: {
          created_at: string | null
          id: string
          perfume_id: string
          user_id: string
          list_type: "owned" | "wishlist" | "tested"
        }
        Insert: {
          created_at?: string | null
          id?: string
          perfume_id: string
          user_id: string
          list_type?: "owned" | "wishlist" | "tested"
        }
        Update: {
          created_at?: string | null
          id?: string
          perfume_id?: string
          user_id?: string
          list_type?: "owned" | "wishlist" | "tested"
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_perfumes: {
        Args: {
          keyword: string
        }
        Returns: {
          id: string
          name: string
          slug: string
          image_url: string | null
          brand_name: string
          similarity_score: number
        }[]
      }
      debug_search_perfumes: {
        Args: {
          p_query: string
        }
        Returns: {
          id: string
          name: string
          brand_name: string
          image_url: string | null
        }[]
      }
      get_comments_with_upvotes: {
        Args: {
          p_perfume_id: string
          p_order_by?: string
        }
        Returns: {
          id: string
          created_at: string
          content: string
          user_id: string
          perfume_id: string
          user_name: string
          upvote_count: number
          user_has_upvoted: boolean
          profile: Json
        }[]
      }
      get_user_comments: {
        Args: {
          p_user_id: string
        }
        Returns: {
          id: string
          created_at: string
          content: string
          perfume_id: string
          perfume_name: string
          perfume_image_url: string | null
          brand_name: string
        }[]
      }
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
