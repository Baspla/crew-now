'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type PageHeadProps = {
    title: string;
    subtitle?: string;
    backUrl?: string | boolean;
};

export default function PageHead({ title, subtitle, backUrl }: PageHeadProps) {
    const router = useRouter();
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        // Check if we can go back in history and if the previous entry is from this app
        setCanGoBack(window.history.length > 1);
    }, []);

    const handleBackClick = () => {
        // Always try to go back first if possible
        if (canGoBack && window.history.length > 1) {
            // Check if the document referrer is from the same origin (same app)
            const referrer = document.referrer;
            const currentOrigin = window.location.origin;
            
            if (referrer && referrer.startsWith(currentOrigin)) {
                router.back();
                return;
            }
        }
        
        // Fall back to the provided backUrl
        if (typeof backUrl === 'string') {
            router.push(backUrl);
        } else if (backUrl === true) {
            // If no specific fallback URL is provided, try router.back() anyway
            router.back();
        }
    };

    return (
        <div className="mb-4">
            <div className="flex items-center space-x-2">
                {/* Back Button - only show if backUrl is provided */}
                {backUrl && (
                    <button
                        onClick={handleBackClick}
                        className="flex items-center cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={4}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6l-6 6 6 6 6"
                            />
                        </svg>
                    </button>
                )}
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            {subtitle && (
                <p className={`text-gray-600 mt-1${backUrl ? ' ml-7' : ''}`}>{subtitle}</p>
            )}
        </div>
    );
}