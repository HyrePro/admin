import React, { useEffect, useRef, useState } from 'react';

interface SchoolInfo {
  name: string;
  location: string;
}

interface SchoolInfoDisplayProps {
  schoolInfo: SchoolInfo | null;
}

const SchoolInfoDisplay: React.FC<SchoolInfoDisplayProps> = ({ schoolInfo }) => {
  const nameRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMarquee, setShowMarquee] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (schoolInfo && measureRef.current && containerRef.current) {
      // Measure the actual full width of the text
      const textWidth = measureRef.current.scrollWidth;
      const containerWidth = containerRef.current.clientWidth;
      const isOverflowing = textWidth > containerWidth;
      
      setShowMarquee(isOverflowing);
      
      if (isOverflowing) {
        // Calculate how far we need to scroll
        setScrollDistance(textWidth - containerWidth);
      }
    }
  }, [schoolInfo]);

  if (!schoolInfo) {
    return (
      <div className="font-medium text-gray-900 text-md min-w-0 flex-1">
        <span className="truncate inline-block w-full">Loading school info...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0 flex-1">
      {/* Hidden element to measure actual text width */}
      <span 
        ref={measureRef}
        className="absolute invisible whitespace-nowrap font-medium text-md pointer-events-none"
        aria-hidden="true"
      >
        {schoolInfo.name}, {schoolInfo.location}
      </span>

      <div 
        ref={containerRef}
        className="font-medium text-gray-900 text-md min-w-0 relative overflow-hidden flex-1"
      >
        {showMarquee ? (
          <div 
            className="whitespace-nowrap inline-block w-max"
            style={{
              animation: `marquee-${scrollDistance} 20s linear infinite`,
            }}
          >
            <span ref={nameRef} className="inline-block pr-4">{schoolInfo.name}, {schoolInfo.location}</span>
          </div>
        ) : (
          <span ref={nameRef} className="truncate inline-block w-full">{schoolInfo.name}, {schoolInfo.location}</span>
        )}
      </div>

      {showMarquee && scrollDistance > 0 && (
        <style>{`
          @keyframes marquee-${scrollDistance} {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-${scrollDistance}px);
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default SchoolInfoDisplay;