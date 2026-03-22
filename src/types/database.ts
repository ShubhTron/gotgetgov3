export type SportType =
  | 'platform_tennis'
  | 'padel'
  | 'tennis'
  | 'squash'
  | 'pickleball'
  | 'golf'
  | 'badminton'
  | 'table_tennis'
  | 'racquetball_squash57'
  | 'beach_tennis'
  | 'real_tennis';

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

export interface Database {
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
          last_seen: string | null;
          created_at: string;
          updated_at: string;
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
          preferred_time: string | null;
          availability: string | null;
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
          preferred_time?: string | null;
          availability?: string | null;
          years_playing?: number;
        };
        Update: Partial<Database['public']['Tables']['user_sport_profiles']['Insert']>;
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
      };
      challenges: {
        Row: {
          id: string;
          sport: SportType;
          format: MatchFormat;
          status: ChallengeStatus;
          proposed_by: string;
          proposed_times: Record<string, unknown> | null;
          confirmed_time: string | null;
          club_id: string | null;
          ladder_id: string | null;
          court_name: string | null;
          message: string | null;
          match_id: string | null;
          expires_at: string | null;
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
          message?: string | null;
          match_id?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>;
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
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          target_user_id: string;
          sport: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_user_id: string;
          sport: string;
        };
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>;
      };
    };
  };
}

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
