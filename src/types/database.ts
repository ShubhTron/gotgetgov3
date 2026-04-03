export type SportType =
  | 'platform_tennis'
  | 'padel'
  | 'tennis'
  | 'squash'
  | 'pickleball'
  | 'beach_tennis';

export type ClubRole = 'player' | 'coach' | 'comp_organizer' | 'club_admin';

export type ChallengeStatus =
  | 'proposed'
  | 'accepted'
  | 'confirmed'
  | 'played'
  | 'scored'
  | 'declined'
  | 'expired'
  | 'cancelled';

export type MatchFormat = 'singles' | 'doubles';

export type CompetitionType = 'league' | 'tournament' | 'ladder';

export type CompetitionFormat =
  | 'round_robin'
  | 'group_stage'
  | 'single_elimination'
  | 'double_elimination'
  | 'swiss';

export type ScoreStatus = 'pending' | 'confirmed' | 'disputed';

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export type NotificationType =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_declined'
  | 'match_result'
  | 'ladder_position_change'
  | 'event_invite'
  | 'circle_invite'
  | 'team_invite'
  | 'competition_update'
  | 'announcement'
  | 'system'
  | 'new_message'
  | 'connection_request_received'
  | 'connection_request_accepted'
  | 'score_reminder'
  | 'score_confirmation_request'
  | 'score_disputed'
  | 'swipe_right_received';

/** Notification types that belong in the activity/bell tab (not chat) */
export const ACTIVITY_NOTIFICATION_TYPES: NotificationType[] = [
  'challenge_received',
  'challenge_accepted',
  'challenge_declined',
  'match_result',
  'ladder_position_change',
  'event_invite',
  'circle_invite',
  'team_invite',
  'competition_update',
  'announcement',
  'system',
  'connection_request_received',
  'connection_request_accepted',
  'score_reminder',
  'score_confirmation_request',
  'score_disputed',
  'swipe_right_received',
];

export type FeedItemType =
  | 'announcement'
  | 'match_result'
  | 'ladder_movement'
  | 'event'
  | 'achievement'
  | 'recommendation';

export type AudienceType = 'circle' | 'club' | 'event' | 'competition' | 'public';

export interface CalendarEventMapping {
  id: string;
  user_id: string;
  item_type: 'challenge' | 'event' | 'competition';
  item_id: string;
  native_event_id: string;
  platform: 'ios' | 'android';
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          bio: string;
          phone: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_city: string | null;
          location_country: string | null;
          home_club_id: string | null;
          onboarding_completed: boolean;
          dark_mode: boolean;
          push_notifications: boolean;
          email_notifications: boolean;
          created_at: string;
          updated_at: string;
          last_seen: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string;
          phone?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_city?: string | null;
          location_country?: string | null;
          home_club_id?: string | null;
          onboarding_completed?: boolean;
          dark_mode?: boolean;
          push_notifications?: boolean;
          email_notifications?: boolean;
          last_seen?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      user_sport_profiles: {
        Row: {
          id: string;
          user_id: string;
          sport: SportType;
          self_assessed_level: string;
          official_rating: string | null;
          official_rating_system: string | null;
          play_style: string | null;
          preferred_format: MatchFormat;
          years_playing: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport: SportType;
          self_assessed_level?: string;
          official_rating?: string | null;
          official_rating_system?: string | null;
          play_style?: string | null;
          preferred_format?: MatchFormat;
          years_playing?: number;
        };
        Update: Partial<Database['public']['Tables']['user_sport_profiles']['Insert']>;
        Relationships: [];
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          description: string;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
          location_lat: number | null;
          location_lng: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          booking_url: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          is_claimed: boolean;
          claimed_by: string | null;
          sports: SportType[];
          amenities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          postal_code?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          booking_url?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          is_claimed?: boolean;
          claimed_by?: string | null;
          sports?: SportType[];
          amenities?: string[];
        };
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>;
        Relationships: [];
      };
      user_clubs: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          is_home_club: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          club_id: string;
          is_home_club?: boolean;
        };
        Update: Partial<Database['public']['Tables']['user_clubs']['Insert']>;
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          connected_user_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connected_user_id: string;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['connections']['Insert']>;
        Relationships: [];
      };
      connection_requests: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
          updated_at: string;
          status_changed_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          recipient_id: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
        };
        Update: Partial<Database['public']['Tables']['connection_requests']['Insert']>;
        Relationships: [];
      };
      circles: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_by: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_by: string;
          avatar_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['circles']['Insert']>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          sport: SportType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          sport: SportType;
        };
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
        Relationships: [];
      };
      circle_members: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          circle_id: string;
          user_id: string;
          role?: string;
        };
        Update: Partial<Database['public']['Tables']['circle_members']['Insert']>;
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          sport: SportType;
          format: MatchFormat;
          club_id: string | null;
          ladder_id: string | null;
          competition_id: string | null;
          competition_fixture_id: string | null;
          scheduled_at: string | null;
          played_at: string | null;
          score: Record<string, unknown> | null;
          score_status: ScoreStatus;
          score_submitted_by: string | null;
          score_confirmed_by: string | null;
          dispute_reason: string | null;
          winner_team: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sport: SportType;
          format?: MatchFormat;
          club_id?: string | null;
          ladder_id?: string | null;
          competition_id?: string | null;
          competition_fixture_id?: string | null;
          scheduled_at?: string | null;
          played_at?: string | null;
          score?: Record<string, unknown> | null;
          score_status?: ScoreStatus;
          score_submitted_by?: string | null;
          score_confirmed_by?: string | null;
          dispute_reason?: string | null;
          winner_team?: number | null;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          sport: SportType;
          format: MatchFormat;
          status: ChallengeStatus;
          score_status: string | null;
          proposed_by: string;
          proposed_times: Record<string, unknown> | null;
          confirmed_time: string | null;
          club_id: string | null;
          ladder_id: string | null;
          court_name: string | null;
          location: string | null;
          message: string | null;
          match_id: string | null;
          expires_at: string | null;
          is_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sport: SportType;
          format?: MatchFormat;
          status?: ChallengeStatus;
          proposed_by: string;
          proposed_times?: Record<string, unknown> | null;
          confirmed_time?: string | null;
          club_id?: string | null;
          ladder_id?: string | null;
          court_name?: string | null;
          location?: string | null;
          message?: string | null;
          match_id?: string | null;
          expires_at?: string | null;
          is_open?: boolean;
        };
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>;
        Relationships: [];
      };
      challenge_players: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          team_number: number;
          response: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          team_number: number;
          response?: string;
        };
        Update: Partial<Database['public']['Tables']['challenge_players']['Insert']>;
        Relationships: [];
      };
      ladders: {
        Row: {
          id: string;
          name: string;
          description: string;
          club_id: string;
          sport: SportType;
          format: MatchFormat;
          created_by: string;
          max_rank_gap: number;
          challenge_response_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          club_id: string;
          sport: SportType;
          format?: MatchFormat;
          created_by: string;
          max_rank_gap?: number;
          challenge_response_days?: number;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['ladders']['Insert']>;
        Relationships: [];
      };
      competitions: {
        Row: {
          id: string;
          name: string;
          description: string;
          club_id: string;
          sport: SportType;
          format: MatchFormat;
          competition_type: CompetitionType;
          competition_format: CompetitionFormat;
          created_by: string;
          start_date: string | null;
          end_date: string | null;
          registration_deadline: string | null;
          max_participants: number | null;
          min_skill_level: string | null;
          max_skill_level: string | null;
          is_active: boolean;
          bracket_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          club_id: string;
          sport: SportType;
          format?: MatchFormat;
          competition_type: CompetitionType;
          competition_format: CompetitionFormat;
          created_by: string;
          start_date?: string | null;
          end_date?: string | null;
          registration_deadline?: string | null;
          max_participants?: number | null;
          min_skill_level?: string | null;
          max_skill_level?: string | null;
          is_active?: boolean;
          bracket_data?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['competitions']['Insert']>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string;
          club_id: string | null;
          sport: SportType | null;
          created_by: string;
          start_time: string;
          end_time: string | null;
          court_name: string | null;
          max_participants: number | null;
          is_casual: boolean;
          is_recurring: boolean;
          recurrence_rule: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          club_id?: string | null;
          sport?: SportType | null;
          created_by: string;
          start_time: string;
          end_time?: string | null;
          court_name?: string | null;
          max_participants?: number | null;
          is_casual?: boolean;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          data: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          data?: Record<string, unknown>;
          read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      feed_items: {
        Row: {
          id: string;
          type: FeedItemType;
          title: string | null;
          content: string | null;
          image_url: string | null;
          club_id: string | null;
          author_id: string | null;
          audience_type: AudienceType;
          audience_id: string | null;
          related_match_id: string | null;
          related_ladder_id: string | null;
          related_competition_id: string | null;
          related_event_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: FeedItemType;
          title?: string | null;
          content?: string | null;
          image_url?: string | null;
          club_id?: string | null;
          author_id?: string | null;
          audience_type?: AudienceType;
          audience_id?: string | null;
          related_match_id?: string | null;
          related_ladder_id?: string | null;
          related_competition_id?: string | null;
          related_event_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['feed_items']['Insert']>;
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database['public']['Tables']['availability']['Insert']>;
        Relationships: [];
      };
      swipe_matches: {
        Row: {
          id: string;
          user_id: string;
          target_user_id: string;
          sport: SportType;
          direction: 'left' | 'right';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_user_id: string;
          sport: SportType;
          direction: 'left' | 'right';
        };
        Update: Partial<Database['public']['Tables']['swipe_matches']['Insert']>;
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          type: 'image' | 'video' | 'text' | 'match_result';
          content: string;
          audience: 'everyone' | 'connections';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'image' | 'video' | 'text' | 'match_result';
          content: string;
          audience?: 'everyone' | 'connections';
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['stories']['Insert']>;
        Relationships: [];
      };
      story_views: {
        Row: {
          id: string;
          story_id: string;
          viewer_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          viewer_id: string;
        };
        Update: Partial<Database['public']['Tables']['story_views']['Insert']>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          type: 'direct' | 'circle' | 'team' | 'group';
          circle_id: string | null;
          team_id: string | null;
          name: string | null;
          avatar_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'direct' | 'circle' | 'team' | 'group';
          circle_id?: string | null;
          team_id?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
          joined_at: string;
          is_admin: boolean;
          is_creator: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          last_read_at?: string | null;
          is_admin?: boolean;
          is_creator?: boolean;
        };
        Update: Partial<Database['public']['Tables']['conversation_participants']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          encrypted_content: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          encrypted_content?: string | null;
          expires_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      profile_details: {
        Row: {
          user_id: string;
          bio: string | null;
          interests: string[] | null;
          gender_preference: string | null;
          occupation: string | null;
          education: string | null;
          pets: string | null;
          hobbies: string[] | null;
          drinking_preference: string | null;
          smoking_preference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          bio?: string | null;
          interests?: string[] | null;
          gender_preference?: string | null;
          occupation?: string | null;
          education?: string | null;
          pets?: string | null;
          hobbies?: string[] | null;
          drinking_preference?: string | null;
          smoking_preference?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profile_details']['Insert']>;
        Relationships: [];
      };
      profile_photos: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          thumbnail_url: string;
          width: number;
          height: number;
          display_order: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          thumbnail_url: string;
          width: number;
          height: number;
          display_order?: number;
        };
        Update: Partial<Database['public']['Tables']['profile_photos']['Insert']>;
        Relationships: [];
      };
      discovery_mode_analytics: {
        Row: {
          id: string;
          event_type: string;
          user_id: string;
          profile_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          user_id: string;
          profile_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Database['public']['Tables']['discovery_mode_analytics']['Insert']>;
        Relationships: [];
      };
      match_results: {
        Row: {
          id: string;
          challenge_id: string | null;
          sport: string;
          format: string;
          played_at: string;
          score: Record<string, unknown>;
          winner_team: number | null;
          submitted_by: string;
          status: string;
          disputed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id?: string | null;
          sport: string;
          format: string;
          played_at: string;
          score: Record<string, unknown>;
          winner_team?: number | null;
          submitted_by: string;
          status?: string;
          disputed_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['match_results']['Insert']>;
        Relationships: [];
      };
      match_result_players: {
        Row: {
          id: string;
          result_id: string;
          user_id: string;
          team_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          result_id: string;
          user_id: string;
          team_number: number;
        };
        Update: Partial<Database['public']['Tables']['match_result_players']['Insert']>;
        Relationships: [];
      };
      liked_players: {
        Row: {
          id: string;
          liker_id: string;
          liked_user_id: string;
          sport: SportType;
          created_at: string;
        };
        Insert: {
          id?: string;
          liker_id: string;
          liked_user_id: string;
          sport: SportType;
        };
        Update: Partial<Database['public']['Tables']['liked_players']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_connection_request: {
        Args: { p_request_id: string; p_status_changed_at: string };
        Returns: string;
      };
      create_connections_for_match: {
        Args: { p_match_id: string };
        Returns: void;
      };
      create_bidirectional_connection: {
        Args: { p_user_id: string; p_connected_user_id: string };
        Returns: void;
      };
      get_or_create_direct_conversation: {
        Args: { user_a: string; user_b: string };
        Returns: string;
      };
      add_group_member: {
        Args: { p_conversation_id: string; p_user_id?: string; p_adding_user_id?: string; p_new_member_id?: string };
        Returns: void;
      };
      remove_group_member: {
        Args: { p_conversation_id: string; p_user_id?: string; p_admin_id?: string; p_member_id?: string };
        Returns: void;
      };
      leave_group_conversation: {
        Args: { p_conversation_id: string; p_user_id: string };
        Returns: void;
      };
      create_group_conversation: {
        Args: { p_name: string; p_creator_id: string; p_member_ids: string[] };
        Returns: string;
      };
      delete_group_conversation: {
        Args: { p_conversation_id: string };
        Returns: void;
      };
      update_group_name: {
        Args: { p_conversation_id: string; p_name: string };
        Returns: void;
      };
      create_broadcast_channel: {
        Args: Record<string, unknown>;
        Returns: string;
      };
      update_channel_details: {
        Args: Record<string, unknown>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Club = Database['public']['Tables']['clubs']['Row'];
export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Ladder = Database['public']['Tables']['ladders']['Row'];
export type Competition = Database['public']['Tables']['competitions']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type FeedItem = Database['public']['Tables']['feed_items']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type ProfileDetails = Database['public']['Tables']['profile_details']['Row'];
export type ProfilePhoto = Database['public']['Tables']['profile_photos']['Row'];
export type DiscoveryModeAnalytics = Database['public']['Tables']['discovery_mode_analytics']['Row'];
export type ConnectionRequest = Database['public']['Tables']['connection_requests']['Row'];

export interface LikedPlayer {
  id: string;           // liked_user_id
  fullName: string;
  avatarUrl: string | null;
  sport: SportType;
}
