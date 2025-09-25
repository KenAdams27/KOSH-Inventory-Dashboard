
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedTitle() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const toRotate = ["KOSH", "KUNAL ENTERPRISES"];

  useEffect(() => {
    if (isAnimationComplete) return;

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
        setLoopNum(1);
      }
      // Finished typing "KUNAL ENTERPRISES"
      else if (!isDeleting && updatedText === toRotate[1]) {
        setIsAnimationComplete(true);
        return;
      }
    };

    const ticker = setTimeout(tick, typingSpeed);
    return () => clearTimeout(ticker);
  }, [text, isDeleting, loopNum, isAnimationComplete]);
  
  return (
    <span
      className={cn(
        !isAnimationComplete && "border-r-2 border-primary animate-blink-caret"
      )}
    >
      {text}
    </span>
  );
}
