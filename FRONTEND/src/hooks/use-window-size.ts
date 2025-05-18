// ==========================================================
// 📐 C.H.A.O.S. WINDOW SIZE DETECTION HOOK 📐
// ==========================================================
// - CROSS-PLATFORM SCREEN SIZE MONITORING
// - RESPONSIVE LAYOUT ADAPTATION
// - DEBOUNCED RESIZE HANDLING FOR PERFORMANCE
// - TAURI & ELECTRON WINDOW COMPATIBILITY
// ==========================================================

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

export function useWindowSize(): WindowSize {
  // Initialize with undefined to avoid hydration mismatch
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  // Debounce helper to improve performance
  function debounce(fn: Function, ms = 300) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 100);

    // Set size initially
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
