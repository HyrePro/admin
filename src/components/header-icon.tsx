import Link from 'next/link';
import React from 'react';

const HeaderIcon = () => {
  return (
   <Link href="/">
    <div className="flex items-center">
      <img
        src="/icon-black-transparent.png"
        alt="HyrePro Icon"
        className="h-12 w-auto object-contain"
      />
    </div></Link>
  );
};

export default HeaderIcon;