import { useEffect } from 'react';
import { trackEvent } from './analytics';

export function useAutoTrackClicks() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const target = e.target.closest('[data-track-click]');
      if (!target) return;


      const eventName = target.getAttribute('data-track-click') || '';
      const buttonName = target.getAttribute('button-name') || ''; 
      const category = target.getAttribute('button-category') || '';
      const word = target.getAttribute('button-text') || '';
      
      trackEvent(eventName, { buttonName, category, word});
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
