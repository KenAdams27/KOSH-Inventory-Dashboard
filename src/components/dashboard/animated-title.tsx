
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedTitle() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const toRotate = ["KOSH", "KUNAL ENTERPRISES"];

  useEffect(() => {
    const tick = () => {
      const i = loopNum % toRotate.length;
      const fullText = toRotate[i];

      let updatedText = '';
      if (isDeleting) {
        updatedText = fullText.substring(0, text.length - 1);
      } else {
        updatedText = fullText.substring(0, text.length + 1);
      }

      setText(updatedText);

      // Finished typing "KOSH"
      if (!isDeleting && updatedText === toRotate[0]) {
        setTimeout(() => setIsDeleting(true), 2000);
      } 
      // Finished deleting "OSH" down to "K"
      else if (isDeleting && updatedText === 'K') {
        setIsDeleting(false);
        setLoopNum(1); // Move to "KUNAL ENTERPRISES"
      }
      // Finished typing "KUNAL ENTERPRISES"
      else if (!isDeleting && updatedText === toRotate[1]) {
        // Stop the animation
        return;
      }
    };

    if (loopNum < toRotate.length) {
        const ticker = setTimeout(tick, typingSpeed);
        return () => clearTimeout(ticker);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, isDeleting, loopNum]);
  
  return (
    <span
      className={cn(
        "border-r-2 border-primary",
        loopNum < toRotate.length && "animate-blink-caret"
      )}
    >
      {text}
    </span>
  );
}
