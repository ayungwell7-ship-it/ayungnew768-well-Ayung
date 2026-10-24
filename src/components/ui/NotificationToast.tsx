import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgStyles = {
          success: 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          error: 'bg-rose-950/95 border-rose-500/80 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
          warning: 'bg-amber-950/95 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          info: 'bg-cyan-950/95 border-cyan-500/80 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
        }[toast.type];

        const Icon = {
          success: CheckCircle2,
          error: XCircle,
          warning: AlertTriangle,
          info: Info,
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 border backdrop-blur-md rounded-md flex items-start gap-3 transition-all animate-in slide-in-from-bottom-3 duration-300 ${bgStyles}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-bold font-cyber tracking-wider">{toast.title}</div>
              {toast.message && <div className="text-xs opacity-90 mt-0.5">{toast.message}</div>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
