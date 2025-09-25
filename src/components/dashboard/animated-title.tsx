"use client";

import { useState, useEffect } from 'react';

export function AnimatedTitle() {
  const [title, setTitle] = useState('KOSH');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTitle('KUNAL ENTERPRISES');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return <span>{title}</span>;
}
