import { Users, ChevronLeft, ChevronRight } from 'lucide-react';

export function InviteFriendsCard() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-teal-500 to-emerald-600 relative select-none flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-white" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-3">
        Know someone who plays?
      </h3>

      <p className="text-white/90 text-base mb-6 max-w-[260px]">
        Invite your friends to join and find even more players to match with!
      </p>

      <div className="flex items-center justify-center gap-8 mt-2">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </div>
          <span className="text-white/80 text-sm">Skip</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2">
            <ChevronRight className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-white text-sm font-medium">Invite</span>
        </div>
      </div>
    </div>
  );
}
