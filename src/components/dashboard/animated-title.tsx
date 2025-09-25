"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function AnimatedTitle() {
  const [title, setTitle] = useState('KOSH');
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setAnimationClass('animate-fade-out');
    }, 1500); // Start fade-out after 1.5s

    const fadeInTimer = setTimeout(() => {
      setTitle('KUNAL ENTERPRISES');
      setAnimationClass('animate-fade-in');
    }, 2000); // Change text and fade-in after fade-out completes (500ms duration)

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(fadeInTimer);
    };
  }, []);

  return <span className={cn("inline-block", animationClass)}>{title}</span>;
}
