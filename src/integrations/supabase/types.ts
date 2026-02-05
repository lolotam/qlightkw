export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_inbox_messages: {
        Row: {
          admin_id: string | null
          attachments: Json | null
          body: string | null
          created_at: string | null
          direction: string | null
          from_email: string
          from_name: string | null
          html_body: string | null
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          metadata: Json | null
          reply_to_id: string | null
          resend_id: string | null
          scheduled_at: string | null
          status: string | null
          subject: string | null
          thread_id: string | null
          to_email: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          attachments?: Json | null
          body?: string | null
          created_at?: string | null
          direction?: string | null
          from_email: string
          from_name?: string | null
          html_body?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          metadata?: Json | null
          reply_to_id?: string | null
          resend_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          attachments?: Json | null
          body?: string | null
          created_at?: string | null
          direction?: string | null
          from_email?: string
          from_name?: string | null
          html_body?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          metadata?: Json | null
          reply_to_id?: string | null
          resend_id?: string | null
          scheduled_at?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_inbox_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "admin_inbox_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content_ar: string | null
          content_en: string | null
          created_at: string
          excerpt_ar: string | null
          excerpt_en: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          scheduled_at: string | null
          slug: string
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          scheduled_at?: string | null
          slug: string
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_ar: string | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_ar?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          cart_id: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          variation_id: string | null
        }
        Insert: {
          added_at?: string
          cart_id: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          variation_id?: string | null
        }
        Update: {
          added_at?: string
          cart_id?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_ar: string
          name_en: string
          parent_id: string | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar: string
          name_en: string
          parent_id?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          discount_applied: number
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_applied: number
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_applied?: number
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_ids: string[] | null
          applicable_to: string | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          description_ar: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_ids?: string[] | null
          applicable_to?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          description_ar?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_ids?: string[] | null
          applicable_to?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          description_ar?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer_ar: string | null
          answer_en: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question_ar: string | null
          question_en: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer_ar?: string | null
          answer_en: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question_ar?: string | null
          question_en: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer_ar?: string | null
          answer_en?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question_ar?: string | null
          question_en?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_toggles: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          feature_key: string
          feature_name: string
          feature_name_ar: string | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          feature_key: string
          feature_name: string
          feature_name_ar?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          feature_key?: string
          feature_name?: string
          feature_name_ar?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          media_type: string
          media_type_mobile: string | null
          media_url: string
          media_url_mobile: string | null
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          media_type_mobile?: string | null
          media_url: string
          media_url_mobile?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          media_type_mobile?: string | null
          media_url?: string
          media_url_mobile?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          language: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      observability_alert_configs: {
        Row: {
          cooldown_minutes: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          metric_name: string | null
          name: string
          notification_channels: string[] | null
          notification_emails: string[] | null
          threshold_operator: string | null
          threshold_value: number
          time_window_minutes: number | null
          trigger_type: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metric_name?: string | null
          name: string
          notification_channels?: string[] | null
          notification_emails?: string[] | null
          threshold_operator?: string | null
          threshold_value: number
          time_window_minutes?: number | null
          trigger_type: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metric_name?: string | null
          name?: string
          notification_channels?: string[] | null
          notification_emails?: string[] | null
          threshold_operator?: string | null
          threshold_value?: number
          time_window_minutes?: number | null
          trigger_type?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      observability_alert_history: {
        Row: {
          alert_config_id: string | null
          alert_name: string
          created_at: string | null
          details: Json | null
          id: string
          is_resolved: boolean | null
          notification_channel: string | null
          notification_sent: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          threshold_value: number
          trigger_type: string
          triggered_value: number
        }
        Insert: {
          alert_config_id?: string | null
          alert_name: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          notification_channel?: string | null
          notification_sent?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          threshold_value: number
          trigger_type: string
          triggered_value: number
        }
        Update: {
          alert_config_id?: string | null
          alert_name?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          notification_channel?: string | null
          notification_sent?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          threshold_value?: number
          trigger_type?: string
          triggered_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "observability_alert_history_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "observability_alert_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      observability_health_snapshots: {
        Row: {
          active_errors_count: number | null
          captured_at: string | null
          database_health: number | null
          edge_functions_health: number | null
          failed_functions_count: number | null
          id: string
          metrics_breakdown: Json | null
          overall_health_score: number
          slow_queries_count: number | null
          storage_health: number | null
          token_health: number | null
        }
        Insert: {
          active_errors_count?: number | null
          captured_at?: string | null
          database_health?: number | null
          edge_functions_health?: number | null
          failed_functions_count?: number | null
          id?: string
          metrics_breakdown?: Json | null
          overall_health_score: number
          slow_queries_count?: number | null
          storage_health?: number | null
          token_health?: number | null
        }
        Update: {
          active_errors_count?: number | null
          captured_at?: string | null
          database_health?: number | null
          edge_functions_health?: number | null
          failed_functions_count?: number | null
          id?: string
          metrics_breakdown?: Json | null
          overall_health_score?: number
          slow_queries_count?: number | null
          storage_health?: number | null
          token_health?: number | null
        }
        Relationships: []
      }
      observability_metrics: {
        Row: {
          avg_duration_ms: number | null
          created_at: string | null
          error_count: number | null
          id: string
          max_duration_ms: number | null
          metadata: Json | null
          metric_category: string | null
          metric_name: string
          metric_type: string
          min_duration_ms: number | null
          p95_duration_ms: number | null
          success_count: number | null
          total_count: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          avg_duration_ms?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          max_duration_ms?: number | null
          metadata?: Json | null
          metric_category?: string | null
          metric_name: string
          metric_type: string
          min_duration_ms?: number | null
          p95_duration_ms?: number | null
          success_count?: number | null
          total_count?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          avg_duration_ms?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          max_duration_ms?: number | null
          metadata?: Json | null
          metric_category?: string | null
          metric_name?: string
          metric_type?: string
          min_duration_ms?: number | null
          p95_duration_ms?: number | null
          success_count?: number | null
          total_count?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name_ar: string | null
          product_name_en: string
          quantity: number
          sku: string | null
          total_price: number
          unit_price: number
          variation_id: string | null
          variation_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name_ar?: string | null
          product_name_en: string
          quantity?: number
          sku?: string | null
          total_price: number
          unit_price: number
          variation_id?: string | null
          variation_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_ar?: string | null
          product_name_en?: string
          quantity?: number
          sku?: string | null
          total_price?: number
          unit_price?: number
          variation_id?: string | null
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          billing_address: Json | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          billing_address?: Json | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          billing_address?: Json | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text_ar: string | null
          alt_text_en: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string | null
          color_hex: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name_ar: string | null
          name_en: string | null
          price_modifier: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
          wattage: string | null
        }
        Insert: {
          color?: string | null
          color_hex?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string | null
          price_modifier?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          wattage?: string | null
        }
        Update: {
          color?: string | null
          color_hex?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string | null
          price_modifier?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          wattage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand_id: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          is_bestseller: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          low_stock_threshold: number | null
          name_ar: string
          name_en: string
          sale_price: number | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          short_description_ar: string | null
          short_description_en: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          stock_quantity: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          low_stock_threshold?: number | null
          name_ar: string
          name_en: string
          sale_price?: number | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          short_description_ar?: string | null
          short_description_en?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          low_stock_threshold?: number | null
          name_ar?: string
          name_en?: string
          sale_price?: number | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          short_description_ar?: string | null
          short_description_en?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          full_name_ar: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          preferred_language: string | null
          preferred_theme: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          full_name_ar?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preferred_theme?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          full_name_ar?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preferred_theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          alt_text_ar: string | null
          alt_text_en: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          project_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          project_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text_ar?: string | null
          alt_text_en?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          project_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_name: string | null
          completion_date: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          seo_description_ar: string | null
          seo_description_en: string | null
          seo_title_ar: string | null
          seo_title_en: string | null
          slug: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          completion_date?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          completion_date?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          seo_description_ar?: string | null
          seo_description_en?: string | null
          seo_title_ar?: string | null
          seo_title_en?: string | null
          slug?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          button_text_ar: string | null
          button_text_en: string | null
          created_at: string | null
          display_order: number | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          starts_at: string | null
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string | null
          title_en: string
          updated_at: string | null
        }
        Insert: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          starts_at?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en: string
          updated_at?: string | null
        }
        Update: {
          button_text_ar?: string | null
          button_text_en?: string | null
          created_at?: string | null
          display_order?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          starts_at?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          os: string | null
          page_title: string | null
          page_url: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          os?: string | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          os?: string | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          category: string
          created_at: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          source: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          level?: string
          message: string
          metadata?: Json | null
          source: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_image_url: string | null
          author_name: string
          author_name_ar: string | null
          author_title: string | null
          author_title_ar: string | null
          content_ar: string | null
          content_en: string
          created_at: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          author_image_url?: string | null
          author_name: string
          author_name_ar?: string | null
          author_title?: string | null
          author_title_ar?: string | null
          content_ar?: string | null
          content_en: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          author_image_url?: string | null
          author_name?: string
          author_name_ar?: string | null
          author_title?: string | null
          author_title_ar?: string | null
          content_ar?: string | null
          content_en?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          added_at: string
          id: string
          product_id: string
          wishlist_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          product_id: string
          wishlist_id: string
        }
        Update: {
          added_at?: string
          id?: string
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "knet" | "cod" | "wamad_transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["knet", "cod", "wamad_transfer"],
    },
  },
} as const
