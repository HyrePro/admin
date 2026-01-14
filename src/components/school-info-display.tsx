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
  const locationRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMarquee, setShowMarquee] = useState(false);
  
  useEffect(() => {
    if (schoolInfo && nameRef.current && containerRef.current) {
      // Check if the text overflows its container
      const isOverflowing = nameRef.current.scrollWidth > containerRef.current.clientWidth;
      setShowMarquee(isOverflowing);
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
      <div 
        ref={containerRef}
        className="font-medium text-gray-900 text-md max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[400px] 2xl:max-w-none min-w-0 relative overflow-hidden"
      >
        {showMarquee ? (
          <div className="absolute inset-0 whitespace-nowrap animate-marquee flex items-center">
            <span ref={nameRef} className="mr-4">{schoolInfo.name}&nbsp;</span>
            <span className="mr-4">{schoolInfo.name}&nbsp;</span>
          </div>
        ) : (
          <span ref={nameRef} className="truncate inline-block w-full">{schoolInfo.name}</span>
        )}
      </div>
      <div className="hidden sm:block text-gray-500 text-sm max-w-[100px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-[200px] min-w-0">
        <span 
          ref={locationRef}
          className={`inline-block w-full whitespace-nowrap ${locationRef.current && locationRef.current.scrollWidth > locationRef.current.clientWidth ? 'overflow-x-auto scrollbar-hide' : 'truncate'}`}
        >
          {schoolInfo.location}
        </span>
      </div>
      
      {/* Mobile-friendly display showing location as secondary line */}
      <div className="sm:hidden text-gray-500 text-sm max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] min-w-0">
        <span 
          ref={locationRef}
          className={`inline-block w-full whitespace-nowrap ${locationRef.current && locationRef.current.scrollWidth > locationRef.current.clientWidth ? 'overflow-x-auto scrollbar-hide' : 'truncate'}`}
        >
          {schoolInfo.location}
        </span>
      </div>
    </div>
  );
};

export default SchoolInfoDisplay;