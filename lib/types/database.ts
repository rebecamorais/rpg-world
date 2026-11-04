export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          expires_at: string;
          token_hash: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          expires_at: string;
          token_hash: string;
          user_id: string;
        };
        Update: {
          expires_at?: string;
          token_hash?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      account_deletion_throttle: {
        Row: {
          failed_password_at: string[];
          last_email_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          failed_password_at?: string[];
          last_email_at?: string | null;
          user_id: string;
        };
        Update: {
          failed_password_at?: string[];
          last_email_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
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
        ComputedFields: never;
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
          spell_ref: string;
        };
        ComputedFields: never;
        Insert: {
          character_id: string;
          created_at?: string | null;
          is_prepared?: boolean | null;
          spell_ref: string;
        };
        Update: {
          character_id?: string;
          created_at?: string | null;
          is_prepared?: boolean | null;
          spell_ref?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'character_spells_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
        ];
      };
      characters: {
        Row: {
          attributes: NonNullable<Json>;
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          hp_current: number;
          hp_max: number;
          id: string;
          kind: string;
          level: number;
          name: string;
          owner_id: string;
          system: Database['public']['Enums']['rpg_system'];
          system_data: NonNullable<Json>;
          theme_color: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attributes?: NonNullable<Json>;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          hp_current?: number;
          hp_max?: number;
          id?: string;
          kind?: string;
          level?: number;
          name: string;
          owner_id: string;
          system?: Database['public']['Enums']['rpg_system'];
          system_data?: NonNullable<Json>;
          theme_color?: string | null;
          updated_at?: string;
        };
        Update: {
          attributes?: NonNullable<Json>;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          hp_current?: number;
          hp_max?: number;
          id?: string;
          kind?: string;
          level?: number;
          name?: string;
          owner_id?: string;
          system?: Database['public']['Enums']['rpg_system'];
          system_data?: NonNullable<Json>;
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
      containers: {
        Row: {
          character_id: string | null;
          coins: NonNullable<Json>;
          created_at: string;
          id: string;
          kind: string;
          name: string | null;
          party_id: string | null;
          position: number;
        };
        ComputedFields: never;
        Insert: {
          character_id?: string | null;
          coins?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          kind: string;
          name?: string | null;
          party_id?: string | null;
          position?: number;
        };
        Update: {
          character_id?: string | null;
          coins?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string | null;
          party_id?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'containers_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'containers_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
        ];
      };
      encounter_participants: {
        Row: {
          character_id: string;
          conditions: NonNullable<Json>;
          created_at: string;
          hp_current: number | null;
          hp_temp: number | null;
          id: string;
          initiative: number | null;
          label: string | null;
          party_id: string;
          position: number;
          side: string;
        };
        ComputedFields: never;
        Insert: {
          character_id: string;
          conditions?: NonNullable<Json>;
          created_at?: string;
          hp_current?: number | null;
          hp_temp?: number | null;
          id?: string;
          initiative?: number | null;
          label?: string | null;
          party_id: string;
          position?: number;
          side: string;
        };
        Update: {
          character_id?: string;
          conditions?: NonNullable<Json>;
          created_at?: string;
          hp_current?: number | null;
          hp_temp?: number | null;
          id?: string;
          initiative?: number | null;
          label?: string | null;
          party_id?: string;
          position?: number;
          side?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'encounter_participants_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'encounter_participants_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'encounters';
            referencedColumns: ['party_id'];
          },
        ];
      };
      encounters: {
        Row: {
          created_at: string;
          current_participant_id: string | null;
          party_id: string;
          round: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          current_participant_id?: string | null;
          party_id: string;
          round?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_participant_id?: string | null;
          party_id?: string;
          round?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'encounters_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: true;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
        ];
      };
      feedback: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          message: string;
          status: string;
          type: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message: string;
          status?: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string;
          status?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_items: {
        Row: {
          container_id: string;
          created_at: string;
          id: string;
          item_ref: string;
          quantity: number;
        };
        ComputedFields: never;
        Insert: {
          container_id: string;
          created_at?: string;
          id?: string;
          item_ref: string;
          quantity: number;
        };
        Update: {
          container_id?: string;
          created_at?: string;
          id?: string;
          item_ref?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_items_container_id_fkey';
            columns: ['container_id'];
            isOneToOne: false;
            referencedRelation: 'containers';
            referencedColumns: ['id'];
          },
        ];
      };
      parties: {
        Row: {
          created_at: string;
          edition: string;
          gm_id: string | null;
          id: string;
          image_url: string | null;
          name: string;
          system: Database['public']['Enums']['rpg_system'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          edition?: string;
          gm_id?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          system?: Database['public']['Enums']['rpg_system'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          edition?: string;
          gm_id?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          system?: Database['public']['Enums']['rpg_system'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'parties_gm_id_fkey';
            columns: ['gm_id'];
            isOneToOne: false;
            referencedRelation: 'profile';
            referencedColumns: ['id'];
          },
        ];
      };
      party_characters: {
        Row: {
          character_id: string;
          party_id: string;
        };
        ComputedFields: never;
        Insert: {
          character_id: string;
          party_id: string;
        };
        Update: {
          character_id?: string;
          party_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_characters_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'party_characters_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
        ];
      };
      party_gm_claim_votes: {
        Row: {
          created_at: string;
          party_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          party_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          party_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_gm_claim_votes_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'party_gm_claims';
            referencedColumns: ['party_id'];
          },
          {
            foreignKeyName: 'party_gm_claim_votes_party_id_user_id_fkey';
            columns: ['party_id', 'user_id'];
            isOneToOne: true;
            referencedRelation: 'party_members';
            referencedColumns: ['party_id', 'user_id'];
          },
        ];
      };
      party_gm_claims: {
        Row: {
          candidate_id: string;
          created_at: string;
          party_id: string;
        };
        ComputedFields: never;
        Insert: {
          candidate_id: string;
          created_at?: string;
          party_id: string;
        };
        Update: {
          candidate_id?: string;
          created_at?: string;
          party_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_gm_claims_party_id_candidate_id_fkey';
            columns: ['party_id', 'candidate_id'];
            isOneToOne: false;
            referencedRelation: 'party_members';
            referencedColumns: ['party_id', 'user_id'];
          },
        ];
      };
      party_invites: {
        Row: {
          code: string;
          party_id: string;
        };
        ComputedFields: never;
        Insert: {
          code?: string;
          party_id: string;
        };
        Update: {
          code?: string;
          party_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_invites_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: true;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
        ];
      };
      party_journals: {
        Row: {
          doc_id: string;
          party_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          doc_id: string;
          party_id: string;
          updated_at?: string;
        };
        Update: {
          doc_id?: string;
          party_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_journals_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: true;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
        ];
      };
      party_members: {
        Row: {
          created_at: string;
          party_id: string;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          party_id: string;
          status: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          party_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'party_members_party_id_fkey';
            columns: ['party_id'];
            isOneToOne: false;
            referencedRelation: 'parties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'party_members_user_id_fkey';
            columns: ['user_id'];
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
          username: string;
          username_chosen: boolean;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          primary_color?: string | null;
          updated_at?: string;
          username?: string;
          username_chosen?: boolean;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          primary_color?: string | null;
          updated_at?: string;
          username?: string;
          username_chosen?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_inventory_item: {
        Args: { p_container_id: string; p_item_ref: string; p_quantity: number };
        Returns: {
          container_id: string;
          created_at: string;
          id: string;
          item_ref: string;
          quantity: number;
        };
        SetofOptions: {
          from: '*';
          to: 'inventory_items';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      auth_user_exists: { Args: { p_email: string }; Returns: boolean };
      auth_user_has_password: { Args: { p_user_id: string }; Returns: boolean };
      auth_user_id_exists: { Args: { p_user_id: string }; Returns: boolean };
      cancel_party_gm_claim: { Args: { p_party_id: string }; Returns: undefined };
      claim_account_deletion_email: { Args: { p_user_id: string }; Returns: boolean };
      claim_account_deletion_password_attempt: { Args: { p_user_id: string }; Returns: boolean };
      claim_party_gm: { Args: { p_party_id: string }; Returns: string };
      duplicate_character: { Args: { p_character_id: string; p_name: string }; Returns: string };
      encounter_turns: {
        Args: { p_party_id: string };
        Returns: {
          conditions: Json;
          is_current: boolean;
          is_mine: boolean;
          name: string;
          participant_id: string;
          round: number;
        }[];
      };
      end_turn: { Args: { p_participant_id: string; p_party_id: string }; Returns: undefined };
      get_party_invite: {
        Args: { p_code: string };
        Returns: {
          gm_username: string;
          my_status: string;
          name: string;
          party_id: string;
        }[];
      };
      invite_to_party: { Args: { p_party_id: string; p_username: string }; Returns: string };
      my_parties: {
        Args: Record<PropertyKey, never>;
        Returns: {
          active_players: number;
          gm_username: string;
          has_gm: boolean;
          name: string;
          party_id: string;
          pending_requests: number;
          role: string;
          status: string;
          system: string;
        }[];
      };
      orphan_avatar_objects: { Args: { min_age?: string }; Returns: string[] };
      party_gm_claim: {
        Args: { p_party_id: string };
        Returns: {
          candidate_id: string;
          candidate_username: string;
          created_at: string;
          pending_user_ids: string[];
        }[];
      };
      party_invite_card: {
        Args: { p_code: string };
        Returns: {
          image_url: string;
          name: string;
        }[];
      };
      party_people: {
        Args: { p_party_id: string };
        Returns: {
          avatar_url: string;
          status: string;
          user_id: string;
          username: string;
        }[];
      };
      party_roster: {
        Args: { p_party_id: string };
        Returns: {
          avatar_url: string;
          character_id: string;
          class: string;
          level: number;
          name: string;
          owner_id: string;
          race: string;
          theme_color: string;
        }[];
      };
      release_account_deletion_password_attempt: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      request_party_join: { Args: { p_code: string }; Returns: string };
      set_encounter_order: {
        Args: { p_participant_ids: string[]; p_party_id: string };
        Returns: undefined;
      };
      set_participant_conditions: {
        Args: { p_conditions: Json; p_participant_id: string; p_party_id: string };
        Returns: boolean;
      };
      start_encounter: { Args: { p_party_id: string }; Returns: undefined };
      support_party_gm_claim: {
        Args: { p_party_id: string };
        Returns: {
          candidate_id: string;
          created_at: string;
          pending_email: string;
          pending_user_id: string;
        }[];
      };
      support_remove_unresponsive_member: {
        Args: { p_party_id: string; p_user_id: string };
        Returns: string;
      };
      vote_party_gm_claim: { Args: { p_accept: boolean; p_party_id: string }; Returns: string };
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      rpg_system: ['dnd_5e', 'ezd6', 'pathfinder_2e'],
    },
  },
} as const;
