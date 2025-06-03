import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function PeekableText({ text, isHidden, className }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isHidden) {
      // Check if user has seen the hint before
      const hasSeenHint = localStorage.getItem('hafazan-peekable-hint-seen');
      if (!hasSeenHint) {
        setShowHint(true);
        localStorage.setItem('hafazan-peekable-hint-seen', 'true');
      }
    }
  }, [isHidden]);

  if (!isHidden) {
    return <div className={className} dir="rtl">{text}</div>;
  }

  // Split text into words while preserving Arabic word boundaries
  const words = text.split(/(\s+)/).filter(word => word.trim().length > 0);
  
  return (
    <div className={clsx(className, 'relative select-none')} dir="rtl">
      <div className="flex flex-wrap justify-center leading-loose">
        {words.map((word, index) => (
          <span
            key={index}
            className="inline-block mx-1 my-1 cursor-pointer transition-all duration-300 blur-md hover:blur-none"
          >
            {word}
          </span>
        ))}
      </div>
      
      {/* First-time hint text - positioned to the center */}
      {showHint && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-full text-sm font-['Inter']">
            <span>Hover over words to reveal</span>
          </div>
        </div>
      )}
    </div>
  );
}