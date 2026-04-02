export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      character_lore: {
        Row: {
          age: string | null;
          allies_and_enemies: string | null;
          backstory: string | null;
          bonds: string | null;
          character_id: string;
          created_at: string;
          eyes: string | null;
          flaws: string | null;
          hair: string | null;
          height: string | null;
          ideals: string | null;
          organizations: string | null;
          personality_traits: string | null;
          skin: string | null;
          treasure: string | null;
          updated_at: string;
          weight: string | null;
        };
        Insert: {
          age?: string | null;
          allies_and_enemies?: string | null;
          backstory?: string | null;
          bonds?: string | null;
          character_id: string;
          created_at?: string;
          eyes?: string | null;
          flaws?: string | null;
          hair?: string | null;
          height?: string | null;
          ideals?: string | null;
          organizations?: string | null;
          personality_traits?: string | null;
          skin?: string | null;
          treasure?: string | null;
          updated_at?: string;
          weight?: string | null;
        };
        Update: {
          age?: string | null;
          allies_and_enemies?: string | null;
          backstory?: string | null;
          bonds?: string | null;
          character_id?: string;
          created_at?: string;
          eyes?: string | null;
          flaws?: string | null;
          hair?: string | null;
          height?: string | null;
          ideals?: string | null;
          organizations?: string | null;
          personality_traits?: string | null;
          skin?: string | null;
          treasure?: string | null;
          updated_at?: string;
          weight?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'character_lore_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: true;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
        ];
      };
      character_spells: {
        Row: {
          character_id: string;
          created_at: string | null;
          is_prepared: boolean | null;
          spell_id: string;
        };
        Insert: {
          character_id: string;
          created_at?: string | null;
          is_prepared?: boolean | null;
          spell_id: string;
        };
        Update: {
          character_id?: string;
          created_at?: string | null;
          is_prepared?: boolean | null;
          spell_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'character_spells_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'character_spells_spell_id_fkey';
            columns: ['spell_id'];
            isOneToOne: false;
            referencedRelation: 'spells';
            referencedColumns: ['id'];
          },
        ];
      };
      characters: {
        Row: {
          attributes: Json;
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          hp_current: number;
          hp_max: number;
          id: string;
          level: number;
          name: string;
          owner_id: string;
          system: Database['public']['Enums']['rpg_system'];
          system_data: Json;
          theme_color: string | null;
          updated_at: string;
        };
        Insert: {
          attributes?: Json;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          hp_current?: number;
          hp_max?: number;
          id?: string;
          level?: number;
          name: string;
          owner_id: string;
          system?: Database['public']['Enums']['rpg_system'];
          system_data?: Json;
          theme_color?: string | null;
          updated_at?: string;
        };
        Update: {
          attributes?: Json;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          hp_current?: number;
          hp_max?: number;
          id?: string;
          level?: number;
          name?: string;
          owner_id?: string;
          system?: Database['public']['Enums']['rpg_system'];
          system_data?: Json;
          theme_color?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'characters_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
        ];
      };
      profile: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          primary_color: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          primary_color?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          primary_color?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      spell_translations: {
        Row: {
          description: string;
          higher_level: string | null;
          id: string;
          is_verified: boolean | null;
          locale: string;
          material: string | null;
          name: string;
          spell_id: string | null;
        };
        Insert: {
          description: string;
          higher_level?: string | null;
          id?: string;
          is_verified?: boolean | null;
          locale: string;
          material?: string | null;
          name: string;
          spell_id?: string | null;
        };
        Update: {
          description?: string;
          higher_level?: string | null;
          id?: string;
          is_verified?: boolean | null;
          locale?: string;
          material?: string | null;
          name?: string;
          spell_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'spell_translations_spell_id_fkey';
            columns: ['spell_id'];
            isOneToOne: false;
            referencedRelation: 'spells';
            referencedColumns: ['id'];
          },
        ];
      };
      spells: {
        Row: {
          casting_time: string | null;
          casting_value: number | null;
          classes: string[] | null;
          components: string[] | null;
          concentration: boolean | null;
          created_at: string | null;
          duration_unit: string | null;
          duration_value: number | null;
          external_index: string | null;
          id: string;
          is_scaling: boolean | null;
          level: number;
          material_cost: number | null;
          range_unit: string | null;
          range_value: number | null;
          ritual: boolean | null;
          school: string | null;
          system: Database['public']['Enums']['rpg_system'];
        };
        Insert: {
          casting_time?: string | null;
          casting_value?: number | null;
          classes?: string[] | null;
          components?: string[] | null;
          concentration?: boolean | null;
          created_at?: string | null;
          duration_unit?: string | null;
          duration_value?: number | null;
          external_index?: string | null;
          id?: string;
          is_scaling?: boolean | null;
          level: number;
          material_cost?: number | null;
          range_unit?: string | null;
          range_value?: number | null;
          ritual?: boolean | null;
          school?: string | null;
          system?: Database['public']['Enums']['rpg_system'];
        };
        Update: {
          casting_time?: string | null;
          casting_value?: number | null;
          classes?: string[] | null;
          components?: string[] | null;
          concentration?: boolean | null;
          created_at?: string | null;
          duration_unit?: string | null;
          duration_value?: number | null;
          external_index?: string | null;
          id?: string;
          is_scaling?: boolean | null;
          level?: number;
          material_cost?: number | null;
          range_unit?: string | null;
          range_value?: number | null;
          ritual?: boolean | null;
          school?: string | null;
          system?: Database['public']['Enums']['rpg_system'];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      rpg_system: 'dnd_5e' | 'ezd6' | 'pathfinder_2e';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      rpg_system: ['dnd_5e', 'ezd6', 'pathfinder_2e'],
    },
  },
} as const;
