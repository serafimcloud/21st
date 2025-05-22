export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          plan: Database["public"]["Enums"]["api_plan"] | null
          project_url: string | null
          requests_count: number | null
          requests_limit: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_used_at?: string | null
          plan?: Database["public"]["Enums"]["api_plan"] | null
          project_url?: string | null
          requests_count?: number | null
          requests_limit?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_used_at?: string | null
          plan?: Database["public"]["Enums"]["api_plan"] | null
          project_url?: string | null
          requests_count?: number | null
          requests_limit?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      author_payouts: {
        Row: {
          author_id: string
          created_at: string | null
          id: number
          paypal_email: string
          period_end: string
          period_start: string
          processed_at: string | null
          status: string
          total_amount: number
          total_usage: number
          transaction_id: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          id?: number
          paypal_email: string
          period_end: string
          period_start: string
          processed_at?: string | null
          status?: string
          total_amount: number
          total_usage: number
          transaction_id?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          id?: number
          paypal_email?: string
          period_end?: string
          period_start?: string
          processed_at?: string | null
          status?: string
          total_amount?: number
          total_usage?: number
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_code_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string | null
          item_id: number | null
          item_type: string | null
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          item_id?: number | null
          item_type?: string | null
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          item_id?: number | null
          item_type?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      backup_usage_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string | null
          item_id: number | null
          item_type: string | null
          metadata: Json | null
          usage_description: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          item_id?: number | null
          item_type?: string | null
          metadata?: Json | null
          usage_description?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          item_id?: number | null
          item_type?: string | null
          metadata?: Json | null
          usage_description?: string | null
        }
        Relationships: []
      }
      bundle_items: {
        Row: {
          bundle_id: number
          component_id: number
          created_at: string
          id: number
        }
        Insert: {
          bundle_id: number
          component_id: number
          created_at?: string
          id?: number
        }
        Update: {
          bundle_id?: number
          component_id?: number
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
        ]
      }
      bundle_plans: {
        Row: {
          bundle_id: number
          created_at: string
          description: string
          features: string[]
          id: number
          price: number
          type: Database["public"]["Enums"]["bundle_plan_type"]
        }
        Insert: {
          bundle_id: number
          created_at?: string
          description: string
          features?: string[]
          id?: number
          price: number
          type: Database["public"]["Enums"]["bundle_plan_type"]
        }
        Update: {
          bundle_id?: number
          created_at?: string
          description?: string
          features?: string[]
          id?: number
          price?: number
          type?: Database["public"]["Enums"]["bundle_plan_type"]
        }
        Relationships: [
          {
            foreignKeyName: "bundle_plans_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_purchases: {
        Row: {
          bundle_id: number
          created_at: string
          fee: number
          id: string
          paid_to_user: boolean
          plan_id: number
          price: number
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          bundle_id: number
          created_at?: string
          fee: number
          id: string
          paid_to_user?: boolean
          plan_id: number
          price: number
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          bundle_id?: number
          created_at?: string
          fee?: number
          id?: string
          paid_to_user?: boolean
          plan_id?: number
          price?: number
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_purchases_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bundle_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bundle_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string
          id: number
          is_public: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_public?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_public?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bundles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      code_embeddings: {
        Row: {
          created_at: string | null
          embedding: string
          id: string
          item_id: number
          item_type: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: string
          item_id: number
          item_type: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: string
          item_id?: number
          item_type?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      component_analytics: {
        Row: {
          activity_type: string | null
          anon_id: string | null
          component_id: number
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          anon_id?: string | null
          component_id: number
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          anon_id?: string | null
          component_id?: number
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "component_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      component_dependencies_closure: {
        Row: {
          component_id: number
          dependency_component_id: number
          depth: number
          is_demo_dependency: boolean
        }
        Insert: {
          component_id: number
          dependency_component_id: number
          depth: number
          is_demo_dependency?: boolean
        }
        Update: {
          component_id?: number
          dependency_component_id?: number
          depth?: number
          is_demo_dependency?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
        ]
      }
      component_hunt_rounds: {
        Row: {
          created_at: string | null
          end_at: string
          id: number
          seasonal_tag_id: number | null
          start_at: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          end_at: string
          id?: never
          seasonal_tag_id?: number | null
          start_at: string
          week_number: number
        }
        Update: {
          created_at?: string | null
          end_at?: string
          id?: never
          seasonal_tag_id?: number | null
          start_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "component_hunt_rounds_seasonal_tag_id_fkey"
            columns: ["seasonal_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      component_likes: {
        Row: {
          component_id: number
          liked_at: string | null
          user_id: string
        }
        Insert: {
          component_id: number
          liked_at?: string | null
          user_id: string
        }
        Update: {
          component_id?: number
          liked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_likes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_likes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_likes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_likes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_likes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_likes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "component_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      component_tags: {
        Row: {
          component_id: number
          tag_id: number
        }
        Insert: {
          component_id?: number
          tag_id: number
        }
        Update: {
          component_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "component_tags_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_tags_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_tags_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_tags_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_tags_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_tags_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      components: {
        Row: {
          code: string
          compiled_css: string | null
          component_names: Json
          component_slug: string
          created_at: string
          demo_code: string | null
          demo_dependencies: Json | null
          demo_direct_registry_dependencies: Json
          dependencies: Json | null
          description: string | null
          direct_registry_dependencies: Json
          downloads_count: number
          fts: unknown | null
          global_css_extension: string | null
          hunter_username: string | null
          id: number
          index_css_url: string | null
          is_public: boolean
          license: string
          likes_count: number
          name: string
          payment_url: string | null
          preview_url: string
          pro_preview_image_url: string | null
          registry: string
          registry_url: string | null
          sandbox_id: string | null
          tailwind_config_extension: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          website_url: string | null
        }
        Insert: {
          code?: string
          compiled_css?: string | null
          component_names: Json
          component_slug: string
          created_at?: string
          demo_code?: string | null
          demo_dependencies?: Json | null
          demo_direct_registry_dependencies?: Json
          dependencies?: Json | null
          description?: string | null
          direct_registry_dependencies?: Json
          downloads_count?: number
          fts?: unknown | null
          global_css_extension?: string | null
          hunter_username?: string | null
          id?: number
          index_css_url?: string | null
          is_public?: boolean
          license?: string
          likes_count?: number
          name: string
          payment_url?: string | null
          preview_url: string
          pro_preview_image_url?: string | null
          registry?: string
          registry_url?: string | null
          sandbox_id?: string | null
          tailwind_config_extension?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          website_url?: string | null
        }
        Update: {
          code?: string
          compiled_css?: string | null
          component_names?: Json
          component_slug?: string
          created_at?: string
          demo_code?: string | null
          demo_dependencies?: Json | null
          demo_direct_registry_dependencies?: Json
          dependencies?: Json | null
          description?: string | null
          direct_registry_dependencies?: Json
          downloads_count?: number
          fts?: unknown | null
          global_css_extension?: string | null
          hunter_username?: string | null
          id?: number
          index_css_url?: string | null
          is_public?: boolean
          license?: string
          likes_count?: number
          name?: string
          payment_url?: string | null
          preview_url?: string
          pro_preview_image_url?: string | null
          registry?: string
          registry_url?: string | null
          sandbox_id?: string | null
          tailwind_config_extension?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["dependency_author_username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["source_author_username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["dependency_author_username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["source_author_username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["dependency_author_username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["source_author_username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["username"]
          },
          {
            foreignKeyName: "components_hunter_username_fkey"
            columns: ["hunter_username"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["username"]
          },
          {
            foreignKeyName: "components_sandbox_id_fkey"
            columns: ["sandbox_id"]
            isOneToOne: false
            referencedRelation: "sandboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      components_purchases: {
        Row: {
          component_id: number
          created_at: string | null
          id: string
          price_paid: number
          user_id: string
        }
        Insert: {
          component_id: number
          created_at?: string | null
          id?: string
          price_paid: number
          user_id: string
        }
        Update: {
          component_id?: number
          created_at?: string | null
          id?: string
          price_paid?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_purchases_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_purchases_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_purchases_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_purchases_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_purchases_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_purchases_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "components_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "components_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      components_to_collections: {
        Row: {
          collection_id: string
          component_id: number
          created_at: string
        }
        Insert: {
          collection_id: string
          component_id: number
          created_at?: string
        }
        Update: {
          collection_id?: string
          component_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_to_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_to_collections_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_to_collections_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_to_collections_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_to_collections_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_to_collections_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_to_collections_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
        ]
      }
      demo_bookmarks: {
        Row: {
          bookmarked_at: string | null
          demo_id: number
          user_id: string
        }
        Insert: {
          bookmarked_at?: string | null
          demo_id: number
          user_id: string
        }
        Update: {
          bookmarked_at?: string | null
          demo_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_demo"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "demos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demo"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["demo_id"]
          },
        ]
      }
      demo_hunt_scores: {
        Row: {
          created_at: string
          demo_id: number
          final_score: number
          id: number
          installs: number
          round_id: number
          views: number
          votes: number
        }
        Insert: {
          created_at?: string
          demo_id: number
          final_score?: number
          id?: never
          installs?: number
          round_id: number
          views?: number
          votes?: number
        }
        Update: {
          created_at?: string
          demo_id?: number
          final_score?: number
          id?: never
          installs?: number
          round_id?: number
          views?: number
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_hunt_scores_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "demos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_scores_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["demo_id"]
          },
          {
            foreignKeyName: "demo_hunt_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_current_round"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_hunt_votes: {
        Row: {
          demo_id: number
          id: number
          round_id: number
          user_id: string
          voted_at: string
        }
        Insert: {
          demo_id: number
          id?: never
          round_id: number
          user_id: string
          voted_at?: string
        }
        Update: {
          demo_id?: number
          id?: never
          round_id?: number
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_hunt_votes_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "demos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_votes_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["demo_id"]
          },
          {
            foreignKeyName: "demo_hunt_votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_current_round"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "demo_hunt_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_hunt_winners: {
        Row: {
          category: Database["public"]["Enums"]["demo_hunt_category"] | null
          created_at: string
          demo_id: number
          id: number
          is_global: boolean
          prize_tier: number
          round_id: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["demo_hunt_category"] | null
          created_at?: string
          demo_id: number
          id?: never
          is_global?: boolean
          prize_tier: number
          round_id: number
        }
        Update: {
          category?: Database["public"]["Enums"]["demo_hunt_category"] | null
          created_at?: string
          demo_id?: number
          id?: never
          is_global?: boolean
          prize_tier?: number
          round_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_hunt_winners_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "demos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_winners_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["demo_id"]
          },
          {
            foreignKeyName: "demo_hunt_winners_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_current_round"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_winners_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_tags: {
        Row: {
          created_at: string | null
          demo_id: number
          id: number
          tag_id: number
        }
        Insert: {
          created_at?: string | null
          demo_id: number
          id?: never
          tag_id: number
        }
        Update: {
          created_at?: string | null
          demo_id?: number
          id?: never
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_tags_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "demos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_tags_demo_id_fkey"
            columns: ["demo_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["demo_id"]
          },
          {
            foreignKeyName: "demo_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      demos: {
        Row: {
          bookmarks_count: number | null
          bundle_hash: string | null
          bundle_html_url: string | null
          compiled_css: string | null
          component_id: number | null
          created_at: string | null
          demo_code: string
          demo_dependencies: Json | null
          demo_direct_registry_dependencies: Json | null
          demo_slug: string
          embedding: string | null
          embedding_oai: string | null
          fts: unknown | null
          id: number
          name: string | null
          preview_url: string | null
          pro_preview_image_url: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          bookmarks_count?: number | null
          bundle_hash?: string | null
          bundle_html_url?: string | null
          compiled_css?: string | null
          component_id?: number | null
          created_at?: string | null
          demo_code: string
          demo_dependencies?: Json | null
          demo_direct_registry_dependencies?: Json | null
          demo_slug?: string
          embedding?: string | null
          embedding_oai?: string | null
          fts?: unknown | null
          id?: number
          name?: string | null
          preview_url?: string | null
          pro_preview_image_url?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          bookmarks_count?: number | null
          bundle_hash?: string | null
          bundle_html_url?: string | null
          compiled_css?: string | null
          component_id?: number | null
          created_at?: string | null
          demo_code?: string
          demo_dependencies?: Json | null
          demo_direct_registry_dependencies?: Json | null
          demo_slug?: string
          embedding?: string | null
          embedding_oai?: string | null
          fts?: unknown | null
          id?: number
          name?: string | null
          preview_url?: string | null
          pro_preview_image_url?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demos_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "demos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "demos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          content: string
          created_at: string
          id: number
          response: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          response?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          response?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_component_usage: {
        Row: {
          author_id: string
          author_share: number
          component_id: number
          created_at: string | null
          generation_request_id: number
          id: number
          payout_id: number | null
          payout_status: string
        }
        Insert: {
          author_id: string
          author_share: number
          component_id: number
          created_at?: string | null
          generation_request_id: number
          id?: never
          payout_id?: number | null
          payout_status?: string
        }
        Update: {
          author_id?: string
          author_share?: number
          component_id?: number
          created_at?: string | null
          generation_request_id?: number
          id?: never
          payout_id?: number | null
          payout_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_component"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_component"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_component"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_component"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_component"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_component"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "fk_generation_request"
            columns: ["generation_request_id"]
            isOneToOne: false
            referencedRelation: "mcp_generation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_generation_requests: {
        Row: {
          api_key: string
          created_at: string | null
          generation_cost: number
          id: number
          search_query: string
          subscription_plan: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          generation_cost: number
          id?: never
          search_query: string
          subscription_plan: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          generation_cost?: number
          id?: never
          search_query?: string
          subscription_plan?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_rates: {
        Row: {
          active_from: string
          active_till: string | null
          activity_type: string
          created_at: string
          id: number
          price: number
          user_id: string | null
        }
        Insert: {
          active_from: string
          active_till?: string | null
          activity_type: string
          created_at?: string
          id?: number
          price: number
          user_id?: string | null
        }
        Update: {
          active_from?: string
          active_till?: string | null
          activity_type?: string
          created_at?: string
          id?: number
          price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payout_rates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          add_usage: number | null
          created_at: string
          env: string | null
          id: number
          period: string | null
          price: number | null
          stripe_plan_id: string | null
          type: string | null
          version: number
        }
        Insert: {
          add_usage?: number | null
          created_at?: string
          env?: string | null
          id?: number
          period?: string | null
          price?: number | null
          stripe_plan_id?: string | null
          type?: string | null
          version?: number
        }
        Update: {
          add_usage?: number | null
          created_at?: string
          env?: string | null
          id?: number
          period?: string | null
          price?: number | null
          stripe_plan_id?: string | null
          type?: string | null
          version?: number
        }
        Relationships: []
      }
      prompt_rules: {
        Row: {
          additional_context: string | null
          created_at: string | null
          id: number
          name: string
          tech_stack: Json | null
          theme: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          created_at?: string | null
          id?: number
          name: string
          tech_stack?: Json | null
          theme?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_context?: string | null
          created_at?: string | null
          id?: number
          name?: string
          tech_stack?: Json | null
          theme?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: number
          notes: string | null
          payment_date: string
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: number
          notes?: string | null
          payment_date: string
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: number
          notes?: string | null
          payment_date?: string
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sandboxes: {
        Row: {
          codesandbox_id: string | null
          component_id: number | null
          created_at: string
          id: string
          name: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          codesandbox_id?: string | null
          component_id?: number | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          codesandbox_id?: string | null
          component_id?: number | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sandbox_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandboxes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandboxes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandboxes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandboxes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandboxes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sandboxes_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
        ]
      }
      submissions: {
        Row: {
          component_id: number
          created_at: string
          id: number
          moderators_feedback: string | null
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          component_id: number
          created_at?: string
          id?: number
          moderators_feedback?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          component_id?: number
          created_at?: string
          id?: number
          moderators_feedback?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "submissions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          description: string | null
          downloads_count: number | null
          id: number
          is_public: boolean | null
          likes_count: number | null
          name: string
          payment_url: string | null
          preview_url: string
          price: number
          template_slug: string
          updated_at: string
          user_id: string
          video_url: string | null
          website_preview_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          id?: number
          is_public?: boolean | null
          likes_count?: number | null
          name: string
          payment_url?: string | null
          preview_url: string
          price?: number
          template_slug: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          website_preview_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          downloads_count?: number | null
          id?: number
          is_public?: boolean | null
          likes_count?: number | null
          name?: string
          payment_url?: string | null
          preview_url?: string
          price?: number
          template_slug?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          website_preview_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_tags: {
        Row: {
          created_at: string | null
          id: number
          tag_id: number
          template_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          tag_id: number
          template_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          tag_id?: number
          template_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_tags_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_embeddings: {
        Row: {
          created_at: string | null
          embedding: string
          id: string
          item_id: number
          item_type: string
          metadata: Json | null
          usage_description: string | null
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: string
          item_id: number
          item_type: string
          metadata?: Json | null
          usage_description?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: string
          item_id?: number
          item_type?: string
          metadata?: Json | null
          usage_description?: string | null
        }
        Relationships: []
      }
      usages: {
        Row: {
          created_at: string
          id: number
          limit: number | null
          usage: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          limit?: number | null
          usage?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          limit?: number | null
          usage?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          bundles_fee: number
          created_at: string
          display_image_url: string | null
          display_name: string | null
          display_username: string | null
          email: string
          github_url: string | null
          id: string
          image_url: string | null
          is_admin: boolean
          is_partner: boolean | null
          manually_added: boolean
          name: string | null
          paypal_email: string | null
          pro_banner_url: string | null
          pro_referral_url: string | null
          ref: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          stripe_id: string | null
          twitter_url: string | null
          updated_at: string | null
          username: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          bundles_fee?: number
          created_at?: string
          display_image_url?: string | null
          display_name?: string | null
          display_username?: string | null
          email?: string
          github_url?: string | null
          id: string
          image_url?: string | null
          is_admin?: boolean
          is_partner?: boolean | null
          manually_added?: boolean
          name?: string | null
          paypal_email?: string | null
          pro_banner_url?: string | null
          pro_referral_url?: string | null
          ref?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stripe_id?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          bundles_fee?: number
          created_at?: string
          display_image_url?: string | null
          display_name?: string | null
          display_username?: string | null
          email?: string
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_admin?: boolean
          is_partner?: boolean | null
          manually_added?: boolean
          name?: string | null
          paypal_email?: string | null
          pro_banner_url?: string | null
          pro_referral_url?: string | null
          ref?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stripe_id?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      users_to_plans: {
        Row: {
          created_at: string
          id: number
          last_paid_at: string | null
          meta: Json | null
          plan_id: number | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          last_paid_at?: string | null
          meta?: Json | null
          plan_id?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          last_paid_at?: string | null
          meta?: Json | null
          plan_id?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_to_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_to_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_to_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      component_dependencies_graph_view: {
        Row: {
          code: string | null
          component_id: number | null
          component_names: Json | null
          component_slug: string | null
          created_at: string | null
          demo_code: string | null
          demo_dependencies: Json | null
          demo_direct_registry_dependencies: Json | null
          dependencies: Json | null
          dependency_author_display_username: string | null
          dependency_author_username: string | null
          dependency_component_id: number | null
          depth: number | null
          description: string | null
          direct_registry_dependencies: Json | null
          downloads_count: number | null
          fts: unknown | null
          id: number | null
          is_demo_dependency: boolean | null
          is_public: boolean | null
          license: string | null
          likes_count: number | null
          name: string | null
          preview_url: string | null
          registry: string | null
          source_author_display_username: string | null
          source_author_username: string | null
          source_component_slug: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      component_dependencies_graph_view_v2: {
        Row: {
          code: string | null
          component_id: number | null
          component_names: Json | null
          component_slug: string | null
          created_at: string | null
          demo_code: string | null
          demo_dependencies: Json | null
          demo_direct_registry_dependencies: Json | null
          dependencies: Json | null
          dependency_author_display_username: string | null
          dependency_author_username: string | null
          dependency_component_id: number | null
          depth: number | null
          description: string | null
          direct_registry_dependencies: Json | null
          downloads_count: number | null
          fts: unknown | null
          global_css_extension: string | null
          id: number | null
          is_demo_dependency: boolean | null
          is_public: boolean | null
          license: string | null
          likes_count: number | null
          name: string | null
          preview_url: string | null
          registry: string | null
          source_author_display_username: string | null
          source_author_username: string | null
          source_component_slug: string | null
          tailwind_config_extension: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      component_dependencies_graph_view_v3: {
        Row: {
          code: string | null
          component_id: number | null
          component_names: Json | null
          component_slug: string | null
          created_at: string | null
          demo_code: string | null
          demo_dependencies: Json | null
          demo_direct_registry_dependencies: Json | null
          dependencies: Json | null
          dependency_author_display_username: string | null
          dependency_author_username: string | null
          dependency_component_id: number | null
          depth: number | null
          description: string | null
          direct_registry_dependencies: Json | null
          downloads_count: number | null
          fts: unknown | null
          global_css_extension: string | null
          id: number | null
          is_demo_dependency: boolean | null
          is_public: boolean | null
          license: string | null
          likes_count: number | null
          name: string | null
          preview_url: string | null
          registry: string | null
          source_author_display_username: string | null
          source_author_username: string | null
          source_component_slug: string | null
          tailwind_config_extension: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_dependencies_closure_dependency_component_id_fkey"
            columns: ["dependency_component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      component_hunt_current_round: {
        Row: {
          end_at: string | null
          id: number | null
          seasonal_tag_id: number | null
          start_at: string | null
          week_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_hunt_rounds_seasonal_tag_id_fkey"
            columns: ["seasonal_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      component_stats: {
        Row: {
          count: number | null
          filter_type: string | null
        }
        Relationships: []
      }
      components_with_username: {
        Row: {
          code: string | null
          component_names: Json | null
          component_slug: string | null
          created_at: string | null
          demo_code: string | null
          demo_dependencies: Json | null
          demo_direct_registry_dependencies: Json | null
          dependencies: Json | null
          description: string | null
          direct_registry_dependencies: Json | null
          downloads_count: number | null
          fts: unknown | null
          id: number | null
          is_public: boolean | null
          license: string | null
          likes_count: number | null
          name: string | null
          preview_url: string | null
          registry: string | null
          updated_at: string | null
          user: Json | null
          user_id: string | null
          username: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "referral_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "components_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_hunt_leaderboard: {
        Row: {
          bookmarks_count: number | null
          bundle_url: Json | null
          component_data: Json | null
          component_user_data: Json | null
          demo_slug: string | null
          final_score: number | null
          global_rank: number | null
          has_voted: boolean | null
          id: number | null
          installs: number | null
          name: string | null
          preview_url: string | null
          round_id: number | null
          tags: Json | null
          total_count: number | null
          updated_at: string | null
          user_data: Json | null
          video_url: string | null
          view_count: number | null
          votes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_hunt_scores_demo_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "demos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_scores_demo_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["demo_id"]
          },
          {
            foreignKeyName: "demo_hunt_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_current_round"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_hunt_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "component_hunt_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_referral_analytics: {
        Row: {
          avg_amount: number | null
          month: string | null
          payments_count: number | null
          total_amount: number | null
        }
        Relationships: []
      }
      mv_component_analytics: {
        Row: {
          activity_type: string | null
          component_id: number | null
          count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "component_dependencies_graph_view_v3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components_with_username"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_analytics_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "mv_detailed_component_analytics"
            referencedColumns: ["component_id"]
          },
        ]
      }
      mv_detailed_component_analytics: {
        Row: {
          anon_cli_download_count: number | null
          anon_total_installs: number | null
          anon_view_count: number | null
          auth_cli_download_count: number | null
          auth_total_installs: number | null
          auth_valid_code_copy_count: number | null
          auth_valid_prompt_copy_count: number | null
          auth_view_count: number | null
          component_id: number | null
          demo_id: number | null
          total_cli_download_count: number | null
          total_installs: number | null
          total_view_count: number | null
          weighted_auth_installs: number | null
        }
        Relationships: []
      }
      referral_analytics: {
        Row: {
          avg_payment: number | null
          email: string | null
          first_payment: string | null
          last_payment: string | null
          referral_code: string | null
          total_earned: number | null
          total_payments: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_author_payouts: {
        Args: Record<PropertyKey, never>
        Returns: {
          author_id: string
          username: string
          display_name: string
          published_components: number
          total_usage: number
          free_plan_usage: number
          paid_plan_usage: number
          potential_amount: number
          actual_amount: number
          has_payouts: boolean
          last_payout_date: string
          last_payout_status: string
        }[]
      }
      analyze_component_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          author_id: string
          username: string
          display_name: string
          component_id: number
          component_name: string
          total_usage: number
          free_plan_usage: number
          paid_plan_usage: number
          total_amount: number
          has_payouts: boolean
        }[]
      }
      check_api_key: {
        Args: { api_key: string }
        Returns: Json
      }
      check_api_key_v2: {
        Args: { api_key: string }
        Returns: Json
      }
      create_api_key: {
        Args: {
          user_id: string
          plan?: Database["public"]["Enums"]["api_plan"]
          requests_limit?: number
        }
        Returns: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          plan: Database["public"]["Enums"]["api_plan"] | null
          project_url: string | null
          requests_count: number | null
          requests_limit: number | null
          user_id: string
        }
      }
      delete_component: {
        Args: { component_id: number }
        Returns: boolean
      }
      find_pg_column_dependencies: {
        Args: {
          schema_name_param: string
          table_name_param: string
          column_name_param: string
        }
        Returns: {
          dependent_object_description: string
          dependency_type_info: string
        }[]
      }
      get_active_authors: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          username: string
          name: string
          image_url: string
          display_username: string
          display_name: string
          display_image_url: string
          bio: string
          total_downloads: number
          total_usages: number
          total_views: number
          total_engagement: number
        }[]
      }
      get_active_authors_with_top_components: {
        Args: { p_offset?: number; p_limit?: number }
        Returns: {
          id: string
          username: string
          name: string
          image_url: string
          display_username: string
          display_name: string
          display_image_url: string
          bio: string
          total_downloads: number
          total_usages: number
          total_views: number
          total_engagement: number
          top_components: Json
          total_count: number
        }[]
      }
      get_admin_liked_demos_v1: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
        }[]
      }
      get_all_author_payouts: {
        Args: {
          p_period?: string
          p_min_amount?: number
          p_max_amount?: number
          p_status?: string
          p_sort_by?: string
          p_sort_order?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json[]
      }
      get_all_author_payouts_count: {
        Args: {
          p_period?: string
          p_min_amount?: number
          p_max_amount?: number
          p_status?: string
        }
        Returns: number
      }
      get_author_payout_stats: {
        Args: { p_author_id: string }
        Returns: Json
      }
      get_collection_components_v1: {
        Args: {
          p_collection_id: string
          p_sort_by: string
          p_offset: number
          p_limit: number
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
        }[]
      }
      get_collections_v1: {
        Args: {
          p_offset?: number
          p_limit?: number
          p_include_private?: boolean
        }
        Returns: {
          id: string
          name: string
          description: string
          cover_url: string
          user_id: string
          created_at: string
          updated_at: string
          is_public: boolean
          slug: string
          components_count: number
          user_data: Json
        }[]
      }
      get_daily_user_earnings: {
        Args: { p_user_id: string }
        Returns: {
          mcp_usages: number
          mcp_earnings: number
          views: number
          views_earnings: number
          total_earnings: number
          date: string
        }[]
      }
      get_daily_user_earnings_v2: {
        Args: { p_user_id: string }
        Returns: {
          mcp_usages: number
          views: number
          code_copies: number
          prompt_copies: number
          cli_downloads: number
          date: string
        }[]
      }
      get_demos_list: {
        Args: {
          p_sort_by: string
          p_offset: number
          p_limit: number
          p_tag_slug?: string
          p_include_private?: boolean
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
        }[]
      }
      get_demos_list_v2: {
        Args: {
          p_sort_by: string
          p_offset: number
          p_limit: number
          p_tag_slug?: string
          p_include_private?: boolean
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
        }[]
      }
      get_demos_submissions: {
        Args: {
          p_sort_by: string
          p_offset: number
          p_limit: number
          p_tag_slug?: string
          p_include_private?: boolean
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
          submission_status: string
          moderators_feedback: string
        }[]
      }
      get_hunt_demos_list: {
        Args: { p_round_id: number }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
          votes: number
          installs: number
          final_score: number
          global_rank: number
          tags: Json
          has_voted: boolean
        }[]
      }
      get_hunt_demos_list_v2: {
        Args: { p_round_id: number }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
          votes: number
          installs: number
          final_score: number
          global_rank: number
          tags: Json
          has_voted: boolean
        }[]
      }
      get_hunt_demos_list_v3: {
        Args: { p_round_id: number }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
          votes: number
          installs: number
          final_score: number
          global_rank: number
          tags: Json
          has_voted: boolean
          submission_status: string
          moderators_feedback: string
        }[]
      }
      get_liked_components: {
        Args: { p_user_id: string }
        Returns: Json[]
      }
      get_missing_usage_embedding_items: {
        Args: Record<PropertyKey, never>
        Returns: {
          item_id: number
          item_type: string
        }[]
      }
      get_pro_publishers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          updated_at: string
          image_url: string
          username: string
          name: string
          email: string
          manually_added: boolean
          is_admin: boolean
          twitter_url: string
          bio: string
          github_url: string
          pro_referral_url: string
          website_url: string
          pro_banner_url: string
          display_name: string
          display_username: string
          display_image_url: string
          ref: string
        }[]
      }
      get_prompt: {
        Args: {
          p_prompt_type: string
          p_rule_id?: number
          p_additional_context?: string
        }
        Returns: string
      }
      get_section_previews: {
        Args: { p_demo_ids: number[] }
        Returns: {
          demo_id: number
          preview_url: string
          video_url: string
        }[]
      }
      get_template_tags: {
        Args: Record<PropertyKey, never>
        Returns: {
          tag_id: number
          tag_name: string
          tag_slug: string
          templates_count: number
        }[]
      }
      get_templates_v3: {
        Args: {
          p_offset?: number
          p_limit?: number
          p_include_private?: boolean
          p_tag_slug?: string
        }
        Returns: {
          id: number
          name: string
          description: string
          preview_url: string
          video_url: string
          website_preview_url: string
          price: number
          payment_url: string
          created_at: string
          updated_at: string
          user_data: Json
          downloads_count: number
          likes_count: number
        }[]
      }
      get_top_components_for_email: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          username: string
          component_slug: string
          preview_url: string
          demo_slug: string
          demo_preview_url: string
          is_current_week: boolean
        }[]
      }
      get_user_bookmarks_list: {
        Args: { p_user_id: string; p_include_private?: boolean }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
        }[]
      }
      get_user_components_counts: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_profile_demo_list: {
        Args: { p_user_id: string; p_include_private?: boolean }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
        }[]
      }
      get_user_profile_demo_list_v2: {
        Args: { p_user_id: string }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          updated_at: string
          created_at: string
          demo_slug: string
          component_data: Json
          user_data: Json
          component_user_data: Json
          total_count: number
          view_count: number
          bookmarks_count: number
          bundle_url: Json
          is_private: boolean
          submission_status: string
          moderators_feedback: string
        }[]
      }
      get_user_state: {
        Args: { user_id_param: string }
        Returns: Json
      }
      hunt_component_tag_slugs: {
        Args: { cid: number }
        Returns: string[]
      }
      hunt_marketing_slugs: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      hunt_toggle_demo_vote: {
        Args: { p_round_id: number; p_demo_id: number }
        Returns: boolean
      }
      hunt_ui_slugs: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      increment: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      increment_api_requests: {
        Args: { key_id: string }
        Returns: undefined
      }
      insert_code_embedding: {
        Args: {
          p_id: string
          p_item_id: number
          p_item_type: string
          p_embedding: string
          p_code: string
          p_metadata: Json
        }
        Returns: undefined
      }
      insert_embedding: {
        Args:
          | {
              p_id: string
              p_item_id: number
              p_item_type: string
              p_embedding: string
              p_usage_description: string
              p_metadata: Json
            }
          | {
              p_item_id: number
              p_item_type: string
              p_embedding: string
              p_usage_description: string
              p_metadata: Json
            }
        Returns: undefined
      }
      is_trigger_operation: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      like_component_by_demo: {
        Args: { p_user_id: string; p_demo_id: number; p_liked: boolean }
        Returns: undefined
      }
      match_embeddings: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          filter?: string
          table_name?: string
        }
        Returns: {
          id: string
          item_id: number
          item_type: string
          embedding: string
          similarity: number
        }[]
      }
      match_embeddings_with_details: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          demo_slug: string
          user_id: string
          component_data: Json
          user_data: Json
          usage_data: Json
        }[]
      }
      process_next_round: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_single_round: {
        Args: { p_round_id: number }
        Returns: undefined
      }
      purchase_component: {
        Args: { p_user_id: string; p_component_id: number }
        Returns: Json
      }
      record_mcp_component_usage: {
        Args:
          | {
              p_user_id: string
              p_api_key: string
              p_search_query: string
              p_component_ids: number[]
              p_author_ids: string[]
            }
          | {
              p_user_id: string
              p_api_key: string
              p_search_query: string
              p_component_ids: number[]
              p_component_names: string[]
              p_author_ids: string[]
            }
        Returns: Json
      }
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_components_preview: {
        Args: { p_search_query: string }
        Returns: {
          id: number
          name: string
          description: string
          preview_url: string
          user_data: Json
          downloads_count: number
          likes_count: number
          component_slug: string
        }[]
      }
      search_demos_ai: {
        Args: {
          match_threshold?: number
          query_embedding?: string
          search_query?: string
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          demo_id: number
          component_data: Json
          user_data: Json
          usage_data: Json
        }[]
      }
      search_demos_ai_oai: {
        Args: {
          match_threshold?: number
          query_embedding?: string
          search_query?: string
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          demo_slug: string
          user_id: string
          component_data: Json
          user_data: Json
          usage_data: Json
        }[]
      }
      search_demos_ai_oai_v2: {
        Args: {
          search_query: string
          query_embedding: string
          match_threshold: number
        }
        Returns: {
          id: number
          name: string
          preview_url: string
          video_url: string
          demo_slug: string
          user_id: string
          component_data: Json
          user_data: Json
          usage_data: Json
        }[]
      }
      update_all_hunt_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_component_dependencies_closure: {
        Args: { p_component_id: number; p_demo_slug?: string }
        Returns: undefined
      }
      update_component_with_tags: {
        Args:
          | {
              p_component_id: number
              p_name?: string
              p_description?: string
              p_license?: string
              p_preview_url?: string
              p_tags?: Json
            }
          | {
              p_component_id: number
              p_name?: string
              p_description?: string
              p_license?: string
              p_preview_url?: string
              p_website_url?: string
              p_tags?: Json
            }
        Returns: undefined
      }
      update_demo_info_as_admin: {
        Args: {
          p_component_id: number
          p_demo_name: string
          p_demo_slug: string
        }
        Returns: Json
      }
      update_demo_tags: {
        Args: { p_demo_id: number; p_tags: Json }
        Returns: undefined
      }
      update_hunt_demos_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_single_demo_score: {
        Args: { p_round_id: number; p_demo_id: number }
        Returns: {
          demo_id: number
          demo_name: string
          auth_views: number
          anon_views: number
          total_views: number
          auth_installs: number
          anon_installs: number
          total_installs: number
          votes_count: number
          old_final_score: number
          new_final_score: number
          expected_score: number
          calculation_details: string
        }[]
      }
      update_submission_as_admin: {
        Args: {
          p_component_id: number
          p_status: Database["public"]["Enums"]["submission_status"]
          p_feedback: string
        }
        Returns: Json
      }
      update_template_tags: {
        Args: { p_template_id: number; p_tags: Json }
        Returns: undefined
      }
      vec_dim: {
        Args: { v: string }
        Returns: number
      }
    }
    Enums: {
      api_plan: "free" | "pro" | "enterprise"
      bundle_plan_type: "individual" | "team" | "enterprise"
      demo_hunt_category: "marketing" | "ui" | "seasonal"
      payment_status: "pending" | "paid" | "rejected" | "refunded"
      submission_status: "on_review" | "featured" | "posted" | "rejected"
      user_role:
        | "designer"
        | "frontend_developer"
        | "backend_developer"
        | "product_manager"
        | "entrepreneur"
    }
    CompositeTypes: {
      component_with_user: {
        id: number | null
        component_names: Json | null
        description: string | null
        code: string | null
        demo_code: string | null
        created_at: string | null
        updated_at: string | null
        user_id: string | null
        dependencies: Json | null
        is_public: boolean | null
        downloads_count: number | null
        likes_count: number | null
        component_slug: string | null
        name: string | null
        demo_dependencies: Json | null
        registry: string | null
        direct_registry_dependencies: Json | null
        demo_direct_registry_dependencies: Json | null
        preview_url: string | null
        license: string | null
        video_url: string | null
        user_data: Json | null
        compiled_css: string | null
        global_css_extension: string | null
        tailwind_config_extension: string | null
        website_url: string | null
        is_paid: boolean | null
        payment_url: string | null
        price: number | null
        pro_preview_image_url: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      api_plan: ["free", "pro", "enterprise"],
      bundle_plan_type: ["individual", "team", "enterprise"],
      demo_hunt_category: ["marketing", "ui", "seasonal"],
      payment_status: ["pending", "paid", "rejected", "refunded"],
      submission_status: ["on_review", "featured", "posted", "rejected"],
      user_role: [
        "designer",
        "frontend_developer",
        "backend_developer",
        "product_manager",
        "entrepreneur",
      ],
    },
  },
} as const
