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
                    className="fixed inset-0 bg-black/20 z-[9998] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sheet */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[9999] transition-transform duration-300 ease-out",
                    "max-h-[80vh] overflow-y-auto",
                    isOpen ? "translate-y-0" : "translate-y-full",
                    className
                )}
            >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-4" />
                <div className="px-6 pb-8">
                    {children}
                </div>
            </div>
        </>
    );
};

export default BottomSheet;
