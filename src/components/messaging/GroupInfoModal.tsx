import { useState, useEffect } from 'react';
import { Shield, Crown, UserMinus, UserPlus, Trash2, LogOut, Edit2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGroupInfo,
  removeGroupMember,
  leaveGroup,
  deleteGroup,
  promoteToAdmin,
  demoteFromAdmin,
  updateGroupDetails,
  type GroupInfo,
} from '@/lib/messaging';
import { AddMemberModal } from './AddMemberModal';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/avatar-utils';

interface GroupInfoModalProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupLeft: () => void;
  onGroupDeleted: () => void;
}

export function GroupInfoModal({
  conversationId,
  open,
  onOpenChange,
  onGroupLeft,
  onGroupDeleted,
}: GroupInfoModalProps) {
  const { user } = useAuth();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && conversationId) {
      loadGroupInfo();
    }
  }, [open, conversationId]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setActionError('');
      setConfirmLeave(false);
      setConfirmDelete(false);
      setRemovingId(null);
    }
  }, [open]);

  const loadGroupInfo = async () => {
    setLoading(true);
    const { data, error: err } = await getGroupInfo(conversationId);
    setLoading(false);
    if (err || !data) {
      setError(err || 'Failed to load group info');
      return;
    }
    setGroupInfo(data);
    setEditName(data.name);
  };

  const currentMember = groupInfo?.members.find((m) => m.id === user?.id);
  const isAdmin = currentMember?.isAdmin ?? false;
  const isCreator = currentMember?.isCreator ?? false;

  const handleSaveEdit = async () => {
    if (!user?.id || !editName.trim()) return;
    setActionError('');
    const result = await updateGroupDetails({
      conversationId,
      adminId: user.id,
      name: editName.trim(),
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to update group');
      return;
    }
    setEditing(false);
    loadGroupInfo();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.id) return;
    setActionError('');
    const result = await removeGroupMember({
      conversationId,
      adminId: user.id,
      memberIdToRemove: memberId,
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to remove member');
      return;
    }
    setRemovingId(null);
    loadGroupInfo();
  };

  const handlePromote = async (memberId: string) => {
    if (!user?.id) return;
    setActionError('');
    const result = await promoteToAdmin({
      conversationId,
      adminId: user.id,
      subscriberIdToPromote: memberId,
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to promote member');
      return;
    }
    loadGroupInfo();
  };

  const handleDemote = async (memberId: string) => {
    if (!user?.id) return;
    setActionError('');
    const result = await demoteFromAdmin({
      conversationId,
      adminId: user.id,
      adminIdToDemote: memberId,
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to demote member');
      return;
    }
    loadGroupInfo();
  };

  const handleLeave = async () => {
    if (!user?.id) return;
    setActionError('');
    const result = await leaveGroup({ conversationId, userId: user.id });
    if (!result.success) {
      setActionError(result.error || 'Failed to leave group');
      setConfirmLeave(false);
      return;
    }
    onGroupLeft();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    setActionError('');
    const result = await deleteGroup({ conversationId, userId: user.id });
    if (!result.success) {
      setActionError(result.error || 'Failed to delete group');
      setConfirmDelete(false);
      return;
    }
    onGroupDeleted();
    onOpenChange(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-acc)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-center" style={{ color: 'var(--color-red)' }}>{error}</p>
          )}

          {groupInfo && !loading && (
            <>
              {/* Group header */}
              <div className="flex flex-col items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-bdr)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-acc-bg)' }}>
                  {groupInfo.avatarUrl ? (
                    <img src={groupInfo.avatarUrl} alt={groupInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-acc)' }}>
                      {groupInfo.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {editing ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Group name"
                      maxLength={100}
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 rounded-full transition-colors"
                      style={{ color: 'var(--color-acc)' }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditName(groupInfo.name); }}
                      className="p-2 rounded-full transition-colors"
                      style={{ color: 'var(--color-t2)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-t1)' }}>{groupInfo.name}</h3>
                    {isAdmin && (
                      <button
                        onClick={() => setEditing(true)}
                        className="p-1"
                        style={{ color: 'var(--color-t3)' }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <p className="text-sm" style={{ color: 'var(--color-t2)' }}>
                  {groupInfo.memberCount} members · Created {formatDate(groupInfo.createdAt)}
                </p>
              </div>

              {actionError && (
                <p className="text-sm text-center" style={{ color: 'var(--color-red)' }}>{actionError}</p>
              )}

              {/* Members list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--color-t2)' }}>
                    Members ({groupInfo.memberCount})
                  </h4>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                    style={{ color: 'var(--color-acc)' }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {groupInfo.members.map((member) => {
                    const isMe = member.id === user?.id;
                    const isConfirmingRemove = removingId === member.id;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-t1)' }}>
                              {member.name}
                              {isMe && <span style={{ color: 'var(--color-t3)' }} className="font-normal"> (you)</span>}
                            </span>
                            {member.isCreator && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            )}
                            {member.isAdmin && !member.isCreator && (
                              <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-acc)' }} />
                            )}
                          </div>
                        </div>

                        {/* Admin controls for non-self members */}
                        {isAdmin && !isMe && (
                          <div className="flex items-center gap-1">
                            {isConfirmingRemove ? (
                              <>
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-xs font-medium px-2 py-1 rounded"
                                  style={{ color: 'var(--color-red)' }}
                                >
                                  Remove?
                                </button>
                                <button
                                  onClick={() => setRemovingId(null)}
                                  className="text-xs px-1 py-1 rounded"
                                  style={{ color: 'var(--color-t2)' }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                {!member.isCreator && (
                                  <>
                                    {member.isAdmin ? (
                                      <button
                                        onClick={() => handleDemote(member.id)}
                                        title="Demote from admin"
                                        className="p-1 rounded"
                                        style={{ color: 'var(--color-t3)' }}
                                      >
                                        <Shield className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handlePromote(member.id)}
                                        title="Promote to admin"
                                        className="p-1 rounded"
                                        style={{ color: 'var(--color-t3)' }}
                                      >
                                        <Shield className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setRemovingId(member.id)}
                                      title="Remove from group"
                                      className="p-1 rounded"
                                      style={{ color: 'var(--color-t3)' }}
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--color-bdr)' }}>
                {confirmLeave ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex-1" style={{ color: 'var(--color-t1)' }}>Leave group?</span>
                    <Button variant="secondary" onClick={() => setConfirmLeave(false)}>Cancel</Button>
                    <Button onClick={handleLeave} style={{ background: 'var(--color-red)', color: '#fff', border: 0 }}>
                      Leave
                    </Button>
                  </div>
                ) : confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex-1" style={{ color: 'var(--color-t1)' }}>Delete group for everyone?</span>
                    <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                    <Button onClick={handleDelete} style={{ background: 'var(--color-red)', color: '#fff', border: 0 }}>
                      Delete
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmLeave(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: 'var(--color-red)' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Leave Group
                    </button>

                    {isCreator && (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ color: 'var(--color-red)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Group
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        </DialogContent>
      </Dialog>

      {groupInfo && (
        <AddMemberModal
          conversationId={conversationId}
          currentMemberIds={groupInfo.members.map((m) => m.id)}
          currentMemberCount={groupInfo.memberCount}
          open={showAddMember}
          onOpenChange={setShowAddMember}
          onMemberAdded={() => {
            setShowAddMember(false);
            loadGroupInfo();
          }}
        />
      )}
    </>
  );
}
