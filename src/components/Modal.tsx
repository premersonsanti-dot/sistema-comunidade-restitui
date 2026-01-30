
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: string;
    iconBgColor?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon = 'edit',
    iconBgColor = 'bg-primary/10 text-primary',
    children,
    maxWidth = 'max-w-xl'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={`bg-white rounded-[2rem] w-full ${maxWidth} relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]`}>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${iconBgColor}`}>
                            <span className="material-icons-round">{icon}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
