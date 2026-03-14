'use client';
import { useEffect, useState, useCallback } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const saved = localStorage.getItem('trustlayer-theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('trustlayer-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('trustlayer-theme', 'light');
      }
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label="Toggle dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="theme-toggle-thumb" />
      <span style={{
        position: 'absolute', right: 7, fontSize: 10,
        opacity: dark ? 0 : 1, transition: 'opacity 0.3s', pointerEvents: 'none'
      }}>☀️</span>
      <span style={{
        position: 'absolute', left: 7, fontSize: 10,
        opacity: dark ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none'
      }}>🌙</span>
    </button>
  );
}
