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
        }
      }
      user_collections: {
        Row: {
          created_at: string | null
          id: string
          perfume_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          perfume_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          perfume_id?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
