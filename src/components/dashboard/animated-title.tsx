"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedTitle() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const toRotate = ["KOSH", "KUNAL ENTERPRISES"];
  const period = 2000;

  useEffect(() => {
    let ticker = setInterval(() => {
      tick();
    }, typingSpeed);

    return () => {
      clearInterval(ticker);
    };
  }, [text, isDeleting, typingSpeed]);

  const tick = () => {
    const i = loopNum % toRotate.length;
    const fullText = toRotate[i];

    let newText = '';
    if (isDeleting) {
      newText = fullText.substring(0, text.length - 1);
    } else {
      newText = fullText.substring(0, text.length + 1);
    }

    setText(newText);

    if (isDeleting) {
      setTypingSpeed(prevSpeed => prevSpeed / 2);
    }

    if (!isDeleting && newText === fullText) {
      if (i === 0) { // Finished typing "KOSH"
        // Pause and then start deleting
        setTimeout(() => {
          setIsDeleting(true);
          setTypingSpeed(100);
        }, 1500);
      } else { // Finished typing "KUNAL ENTERPRISES"
         // This part is for looping, we can stop here if we don't want to loop.
         // For now, it will just stay at "KUNAL ENTERPRISES"
      }
    } else if (isDeleting && newText === 'K') { // Finished deleting "OSH"
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setTypingSpeed(150);
    } else if(isDeleting) {
       setTypingSpeed(100);
    }
  };
  
  if(loopNum >= toRotate.length){
      return (
        <span className="border-r-2 border-primary">
            KUNAL ENTERPRISES
        </span>
      )
  }

  return (
    <span
      className={cn(
        "inline-block border-r-2 border-primary animate-blink-caret",
      )}
    >
      {text}
    </span>
  );
}
