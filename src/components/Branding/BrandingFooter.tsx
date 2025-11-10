'use client';

import Image from 'next/image';

export default function BrandingFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 shadow-lg z-30" style={{ borderTopColor: '#6DC201' }}>
      <div className="flex items-center justify-center gap-8 px-4 py-2 md:py-3">
        {/* VIG Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-16 h-8 md:w-20 md:h-10">
            <Image
              src="/Vienna_Insurance_Group.svg"
              alt="Vienna Insurance Group"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 md:h-8 w-px bg-gray-300" />

        {/* IE Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-24 h-10 md:w-32 md:h-12">
            <Image
              src="/IE.svg"
              alt="IE University"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Optional: Add a collaboration text on larger screens */}
      <div className="hidden lg:block text-center pb-2">
        <p className="text-xs text-gray-500 italic">
          A collaborative research project
        </p>
      </div>
    </div>
  );
}
