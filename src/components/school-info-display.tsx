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
  const locationRef = useRef<HTMLSpanElement>(null);
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
      <div className="font-medium text-gray-900 text-md max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px] xl:max-w-[500px] min-w-0">
        <span className="truncate inline-block w-full">Loading school info...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
      {/* Hidden element to measure actual text width */}
      <span 
        ref={measureRef}
        className="absolute invisible whitespace-nowrap font-medium text-md pointer-events-none"
        aria-hidden="true"
      >
        {schoolInfo.name}
      </span>

      <div 
        ref={containerRef}
        className="font-medium text-gray-900 text-md max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[400px] 2xl:max-w-none min-w-0 relative overflow-hidden"
      >
        {showMarquee ? (
          <div 
            className="whitespace-nowrap inline-block"
            style={{
              animation: `marquee-${scrollDistance} 8s ease-in-out infinite`,
            }}
          >
            <span ref={nameRef} className="inline-block">{schoolInfo.name}</span>
          </div>
        ) : (
          <span ref={nameRef} className="truncate inline-block w-full">{schoolInfo.name}</span>
        )}
      </div>
      
      {/* Desktop location */}
      <div className="hidden sm:block text-gray-500 text-sm max-w-[100px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-[200px] min-w-0">
        <span 
          ref={locationRef}
          className="inline-block w-full truncate"
        >
          {schoolInfo.location}
        </span>
      </div>
      
      {/* Mobile location */}
      <div className="sm:hidden text-gray-500 text-sm max-w-[150px] min-w-0">
        <span className="inline-block w-full truncate">
          {schoolInfo.location}
        </span>
      </div>

      {showMarquee && (
        <style>{`
          @keyframes marquee-${scrollDistance} {
            0% {
              transform: translateX(0);
            }
            20% {
              transform: translateX(0);
            }
            80% {
              transform: translateX(-${scrollDistance}px);
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