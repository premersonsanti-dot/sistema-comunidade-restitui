
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <input
                className={`w-full h-12 bg-slate-50 border-slate-200 rounded-2xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none ${className}`}
                {...props}
            />
        </div>
    );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <select
                className={`w-full h-12 bg-slate-50 border-slate-200 rounded-2xl px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none ${className}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};
