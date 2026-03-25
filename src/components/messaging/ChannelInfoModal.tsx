import { useState, useEffect } from 'react';
import { Shield, Crown, UserMinus, UserPlus, Trash2, LogOut, Edit2, Check, X, Radio } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  getBroadcastChannelInfo,
  removeSubscriber,
  leaveChannel,
  deleteChannel,
  promoteToAdmin,
  demoteFromAdmin,
  updateChannelDetails,
  type BroadcastChannelInfo,
} from '@/lib/messaging';
import { AddSubscriberModal } from './AddSubscriberModal';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/avatar-utils';

interface ChannelInfoModalProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelLeft: () => void;
  onChannelDeleted: () => void;
}

export function ChannelInfoModal({
  conversationId,
  open,
  onOpenChange,
  onChannelLeft,
  onChannelDeleted,
}: ChannelInfoModalProps) {
  const { user } = useAuth();
  const [channelInfo, setChannelInfo] = useState<BroadcastChannelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Add subscriber modal
  const [showAddSubscriber, setShowAddSubscriber] = useState(false);

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && conversationId && user?.id) {
      loadChannelInfo();
    }
  }, [open, conversationId, user?.id]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setActionError('');
      setConfirmLeave(false);
      setConfirmDelete(false);
      setRemovingId(null);
    }
  }, [open]);

  const loadChannelInfo = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error: err } = await getBroadcastChannelInfo(conversationId, user.id);
    setLoading(false);
    if (err || !data) {
      setError(err || 'Failed to load channel info');
      return;
    }
    setChannelInfo(data);
    setEditName(data.name);
  };

  const currentParticipant = channelInfo?.participants.find((p) => p.id === user?.id);
  const isAdmin = currentParticipant?.isAdmin ?? false;
  const isCreator = currentParticipant?.isCreator ?? false;

  const handleSaveEdit = async () => {
    if (!user?.id || !editName.trim()) return;
    setActionError('');
    const result = await updateChannelDetails({
      conversationId,
      adminId: user.id,
      name: editName.trim(),
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to update channel');
      return;
    }
    setEditing(false);
    loadChannelInfo();
  };

  const handleRemoveSubscriber = async (subscriberId: string) => {
    if (!user?.id) return;
    setActionError('');
    const result = await removeSubscriber({
      conversationId,
      adminId: user.id,
      subscriberIdToRemove: subscriberId,
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to remove subscriber');
      return;
    }
    setRemovingId(null);
    loadChannelInfo();
  };

  const handlePromote = async (subscriberId: string) => {
    if (!user?.id) return;
    setActionError('');
    const result = await promoteToAdmin({
      conversationId,
      adminId: user.id,
      subscriberIdToPromote: subscriberId,
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to promote subscriber');
      return;
    }
    loadChannelInfo();
  };

  const handleDemote = async (adminId: string) => {
    if (!user?.id) return;
    setActionError('');
    const result = await demoteFromAdmin({
      conversationId,
      adminId: user.id,
      adminIdToDemote: adminId,
    });
    if (!result.success) {
      setActionError(result.error || 'Failed to demote admin');
      return;
    }
    loadChannelInfo();
  };

  const handleLeave = async () => {
    if (!user?.id) return;
    setActionError('');
    const result = await leaveChannel({ conversationId, userId: user.id });
    if (!result.success) {
      setActionError(result.error || 'Failed to leave channel');
      setConfirmLeave(false);
      return;
    }
    onChannelLeft();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    setActionError('');
    const result = await deleteChannel({ conversationId, userId: user.id });
    if (!result.success) {
      setActionError(result.error || 'Failed to delete channel');
      setConfirmDelete(false);
      return;
    }
    onChannelDeleted();
    onOpenChange(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Channel Info</DialogTitle>
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

          {channelInfo && !loading && (
            <>
              {/* Channel header */}
              <div className="flex flex-col items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-bdr)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-acc-bg)' }}>
                  {channelInfo.avatarUrl ? (
                    <img src={channelInfo.avatarUrl} alt={channelInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    <Radio className="w-8 h-8" style={{ color: 'var(--color-acc)' }} />
                  )}
                </div>

                {editing ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Channel name"
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
                      onClick={() => { setEditing(false); setEditName(channelInfo.name); }}
                      className="p-2 rounded-full transition-colors"
                      style={{ color: 'var(--color-t2)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4" style={{ color: 'var(--color-acc)' }} />
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-t1)' }}>{channelInfo.name}</h3>
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
                  {channelInfo.subscriberCount} subscribers · Created {formatDate(channelInfo.createdAt)}
                </p>
              </div>

              {actionError && (
                <p className="text-sm text-center" style={{ color: 'var(--color-red)' }}>{actionError}</p>
              )}

              {/* Admins list */}
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-t2)' }}>
                  Admins ({channelInfo.adminCount})
                </h4>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {channelInfo.admins.map((admin) => {
                    const isMe = admin.id === user?.id;

                    return (
                      <div
                        key={admin.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={admin.avatarUrl} alt={admin.name} />
                          <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--color-t1)' }}>
                              {admin.name}
                              {isMe && <span style={{ color: 'var(--color-t3)' }} className="font-normal"> (you)</span>}
                            </span>
                            {admin.isCreator && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Creator" />
                            )}
                            {!admin.isCreator && (
                              <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-acc)' }} title="Admin" />
                            )}
                          </div>
                        </div>

                        {/* Admin controls for non-self, non-creator admins */}
                        {isAdmin && !isMe && !admin.isCreator && (
                          <button
                            onClick={() => handleDemote(admin.id)}
                            title="Demote from admin"
                            className="p-1 rounded"
                            style={{ color: 'var(--color-t3)' }}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subscribers list (only visible to admins) */}
              {isAdmin && channelInfo.subscribers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--color-t2)' }}>
                      Subscribers ({channelInfo.subscribers.length})
                    </h4>
                    <button
                      onClick={() => setShowAddSubscriber(true)}
                      className="flex items-center gap-1 text-xs font-medium hover:underline"
                      style={{ color: 'var(--color-acc)' }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {channelInfo.subscribers.map((subscriber) => {
                      const isConfirmingRemove = removingId === subscriber.id;

                      return (
                        <div
                          key={subscriber.id}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={subscriber.avatarUrl} alt={subscriber.name} />
                            <AvatarFallback>{getInitials(subscriber.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block" style={{ color: 'var(--color-t1)' }}>
                              {subscriber.name}
                            </span>
                          </div>

                          {/* Admin controls */}
                          <div className="flex items-center gap-1">
                            {isConfirmingRemove ? (
                              <>
                                <button
                                  onClick={() => handleRemoveSubscriber(subscriber.id)}
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
                                <button
                                  onClick={() => handlePromote(subscriber.id)}
                                  title="Promote to admin"
                                  className="p-1 rounded"
                                  style={{ color: 'var(--color-t3)' }}
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setRemovingId(subscriber.id)}
                                  title="Remove from channel"
                                  className="p-1 rounded"
                                  style={{ color: 'var(--color-t3)' }}
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add subscriber button for admins when no subscribers section shown */}
              {isAdmin && channelInfo.subscribers.length === 0 && (
                <div className="pt-2" style={{ borderTop: '1px solid var(--color-bdr)' }}>
                  <button
                    onClick={() => setShowAddSubscriber(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-acc)' }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Subscriber
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--color-bdr)' }}>
                {confirmLeave ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex-1" style={{ color: 'var(--color-t1)' }}>Leave channel?</span>
                    <Button variant="secondary" onClick={() => setConfirmLeave(false)}>Cancel</Button>
                    <Button onClick={handleLeave} style={{ background: 'var(--color-red)', color: '#fff', border: 0 }}>
                      Leave
                    </Button>
                  </div>
                ) : confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex-1" style={{ color: 'var(--color-t1)' }}>Delete channel for everyone?</span>
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
                      Leave Channel
                    </button>

                    {isCreator && (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ color: 'var(--color-red)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Channel
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

      {channelInfo && isAdmin && (
        <AddSubscriberModal
          conversationId={conversationId}
          currentParticipantIds={channelInfo.participants.map((p) => p.id)}
          currentSubscriberCount={channelInfo.subscriberCount}
          open={showAddSubscriber}
          onOpenChange={setShowAddSubscriber}
          onSubscriberAdded={() => {
            setShowAddSubscriber(false);
            loadChannelInfo();
          }}
        />
      )}
    </>
  );
}
