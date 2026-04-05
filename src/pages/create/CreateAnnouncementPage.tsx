import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { cn } from '@/lib/utils';

interface Club {
  id: string;
  name: string;
  sport?: string;
  memberCount?: number;
}

export function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [taggedSport, setTaggedSport] = useState<SportType | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserClubs();
    }
  }, [user]);

  useEffect(() => {
    if (clubs.length === 1) {
      setSelectedClub(clubs[0]);
      setStep(2);
    }
  }, [clubs]);

  const fetchUserClubs = async () => {
    const { data } = await supabase
      .from('user_clubs')
      .select('club_id, clubs(id, name)')
      .eq('user_id', user!.id);

    if (data) {
      const clubList = data
        .filter((d) => d.clubs)
        .map((d) => ({
          id: (d.clubs as unknown as { id: string; name: string }).id,
          name: (d.clubs as unknown as { id: string; name: string }).name,
        }));
      setClubs(clubList);
    }
  };

  const selectClub = (club: Club) => {
    setSelectedClub(club);
    setStep(2);
  };

  const canSubmit = selectedClub && title.trim() && body.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feed_items').insert({
        type: 'announcement',
        club_id: selectedClub!.id,
        author_id: user!.id,
        title,
        content: body,
        image_url: imageUrl || null,
        audience_type: 'club',
        audience_id: selectedClub!.id,
        metadata: taggedSport ? { tagged_sport: taggedSport } : {},
      });

      if (error) throw error;

      navigate(-1);
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1 && clubs.length > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const allSports = Object.keys(SPORTS) as SportType[];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surf)' }}>
      <div className="sticky top-0 z-10 safe-top" style={{ background: 'var(--color-surf)', borderBottom: '1px solid var(--color-bdr)' }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="p-2 -ml-2"
            style={{ color: 'var(--color-t2)' }}
          >
            {step > 1 && clubs.length > 1 ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
          <h1 className="text-h3 font-bold" style={{ color: 'var(--color-t1)' }}>Create Announcement</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
              Select Club
            </h2>
            {clubs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-body" style={{ color: 'var(--color-t3)' }}>Join a club to post announcements.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => selectClub(club)}
                    className="w-full flex items-center gap-4 p-4 rounded-[12px] transition-colors text-left"
                    style={{ background: '#f9fafb' }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'color-mix(in srgb, var(--color-acc) 10%, transparent)' }}
                    >
                      <span
                        className="text-h3 font-bold"
                        style={{ color: 'var(--color-acc)' }}
                      >
                        {club.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-label font-semibold" style={{ color: 'var(--color-t1)' }}>{club.name}</p>
                      {club.memberCount && (
                        <p className="text-caption" style={{ color: 'var(--color-t3)' }}>{club.memberCount} members</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {clubs.length > 1 && (
              <div className="p-3 rounded-[8px]" style={{ background: '#f9fafb' }}>
                <p className="text-caption" style={{ color: 'var(--color-t3)' }}>Posting to</p>
                <p className="text-label font-semibold" style={{ color: 'var(--color-t1)' }}>{selectedClub?.name}</p>
              </div>
            )}

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Title *
              </label>
              <Input
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What would you like to share with the club?"
                rows={5}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Attach Image (Optional)
              </label>
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Attachment"
                    className="w-full h-48 object-cover rounded-[8px]"
                  />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Paste image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <p className="text-caption" style={{ color: 'var(--color-t3)' }}>
                    Enter an image URL to attach to your announcement.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Tag a Sport (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {allSports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setTaggedSport(taggedSport === sport ? null : sport)}
                    className="px-4 py-2 rounded-full text-label font-medium transition-colors"
                    style={taggedSport === sport
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                  >
                    {SPORTS[sport]?.name || sport}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
