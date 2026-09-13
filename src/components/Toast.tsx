import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  subMessage?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast || toast.type === 'loading') return;

    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-orange-500 animate-spin shrink-0" />;
      case 'success':
        return <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const getBadgeStyle = () => {
    switch (toast.type) {
      case 'loading':
        return 'bg-white/95 border-orange-200 text-gray-800 shadow-orange-100';
      case 'success':
        return 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-100';
      case 'warning':
        return 'bg-amber-50/95 border-amber-200 text-amber-900 shadow-amber-100';
      case 'error':
        return 'bg-red-50/95 border-red-200 text-red-900 shadow-red-100';
      default:
        return 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-100';
    }
  };

  return (
    <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[380px] pointer-events-auto transition-all animate-in fade-in slide-in-from-top-3 duration-300">
      <div
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl border shadow-lg backdrop-blur-md ${getBadgeStyle()}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {getIcon()}
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight truncate">{toast.message}</p>
            {toast.subMessage && (
              <p className="text-[11px] opacity-80 leading-tight mt-0.5 truncate">{toast.subMessage}</p>
            )}
          </div>
        </div>

        {toast.type !== 'loading' && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors shrink-0"
            aria-label="알림 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
