import { useRef, useState } from 'react';
import { Camera, Image, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarSizeClass } from '@/lib/avatar-utils';

interface ImageUploadProps {
  value?: string | null;
  name?: string;
  onChange: (url: string | null, file?: File) => void;
  onOpenChange?: (open: boolean) => void;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

export function ImageUpload({ value, name, onChange, onOpenChange, size = 'xl', className }: ImageUploadProps) {
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const setOpen = (open: boolean) => {
    setShowOptions(open);
    onOpenChange?.(open);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange(url, file);
    }
    setOpen(false);
    if (e.target) e.target.value = '';
  };

  const handleTakePhoto = () => { cameraInputRef.current?.click(); };
  const handleChooseFromLibrary = () => { fileInputRef.current?.click(); };
  const handleRemovePhoto = () => { onChange(null); setOpen(false); };

  const optionBtnStyle = {
    width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, background: 'var(--color-surf-2)', border: 'none', borderRadius: 12,
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
    color: 'var(--color-t1)', transition: 'background 0.15s',
  } as React.CSSProperties;

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={getAvatarSizeClass(size)}>
        <AvatarImage src={value || undefined} alt={name} />
        <AvatarFallback>{getInitials(name || '?')}</AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', bottom: 0, right: 0, width: 32, height: 32,
          background: 'var(--color-acc)', borderRadius: '50%', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <Camera className="w-4 h-4" style={{ color: 'var(--color-bg)' }} />
      </button>

      <AnimatePresence>
        {showOptions && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }}
              onClick={() => setOpen(false)}
            />
            {/* Mobile bottom sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
                background: 'var(--color-surf)', borderRadius: '20px 20px 0 0',
                paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
              }}
              className="md:hidden"
            >
              <div style={{ width: 48, height: 6, background: 'var(--color-bdr)', borderRadius: 3, margin: '12px auto 8px' }} />
              <div style={{ padding: '0 16px 16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 16 }}>
                  Profile Photo
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button type="button" onClick={handleTakePhoto} style={optionBtnStyle}>
                    <Camera className="w-6 h-6" style={{ color: 'var(--color-acc)' }} />
                    Take Photo
                  </button>
                  <button type="button" onClick={handleChooseFromLibrary} style={optionBtnStyle}>
                    <Image className="w-6 h-6" style={{ color: 'var(--color-acc)' }} />
                    Choose from Library
                  </button>
                  {value && (
                    <button type="button" onClick={handleRemovePhoto} style={{ ...optionBtnStyle, background: 'var(--color-red-bg)' }}>
                      <X className="w-6 h-6" style={{ color: 'var(--color-red)' }} />
                      <span style={{ color: 'var(--color-red)' }}>Remove Photo</span>
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => setOpen(false)} style={{ width: '100%', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, color: 'var(--color-t3)', marginTop: 8 }}>
                  Cancel
                </button>
              </div>
            </motion.div>

            {/* Desktop modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 70, background: 'var(--color-surf)', borderRadius: 20,
                padding: 24, width: 400, maxWidth: '90vw',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
              className="hidden md:block"
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 24 }}>
                Profile Photo
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button type="button" onClick={handleTakePhoto} style={optionBtnStyle}>
                  <Camera className="w-6 h-6" style={{ color: 'var(--color-acc)' }} />
                  Take Photo
                </button>
                <button type="button" onClick={handleChooseFromLibrary} style={optionBtnStyle}>
                  <Image className="w-6 h-6" style={{ color: 'var(--color-acc)' }} />
                  Choose from Library
                </button>
                {value && (
                  <button type="button" onClick={handleRemovePhoto} style={{ ...optionBtnStyle, background: 'var(--color-red-bg)' }}>
                    <X className="w-6 h-6" style={{ color: 'var(--color-red)' }} />
                    <span style={{ color: 'var(--color-red)' }}>Remove Photo</span>
                  </button>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)} style={{ width: '100%', padding: '12px', marginTop: 16, background: 'none', border: 'none', borderTop: '1px solid var(--color-bdr)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, color: 'var(--color-t3)' }}>
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
