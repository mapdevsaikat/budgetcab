'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BottomSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose?: () => void;
    className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ children, isOpen, onClose, className }) => {
    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9998] bg-[#180808]/55 backdrop-blur-[2px] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sheet */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-[9999] max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-white/25 bg-white/[0.97] shadow-[0_-28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 ease-out",
                    isOpen ? "translate-y-0" : "translate-y-full",
                    className
                )}
            >
                <div className="mx-auto my-4 h-1.5 w-12 rounded-full bg-stone-400/70" />
                <div className="px-6 pb-8">
                    {children}
                </div>
            </div>
        </>
    );
};

export default BottomSheet;
