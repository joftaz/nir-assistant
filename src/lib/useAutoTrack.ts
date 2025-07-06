import { useEffect } from 'react';
import { trackEvent } from './analytics';

export function useAutoTrackClicks() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;

      const target = e.target.closest('[data-track-click]');
      if (!target) return;

      const eventName = target.getAttribute('data-track-click') || 'unknown-event';

      const eventData: Record<string, string> = {};

      // data-analytics-*
      Array.from(target.attributes).forEach((attr) => {
        if (!attr.name.startsWith('data-analytics-')) return;

        const cleanKey = toCamelCase(attr.name.replace(/^data-analytics-/, ''));
        eventData[cleanKey] = attr.value;
      });

      trackEvent(eventName, eventData);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
}

function toCamelCase(str: string) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

// import { useEffect } from 'react';
// import { trackEvent } from './analytics';

// export function useAutoTrackClicks() {
//   useEffect(() => {
//     const handleClick = (e: MouseEvent) => {
//       if (!(e.target instanceof Element)) return;

//       const target = e.target.closest('[data-track-click]');
//       if (!target) return;

//       const eventName = target.getAttribute('data-track-click') || 'unknown-event';

//       const dataset = (target as HTMLElement).dataset;

//       const eventData: Record<string, string> = {};

//       for (const [key, value] of Object.entries(dataset)) {
//         if (key === 'trackClick') continue;
//         if (value !== undefined) {
//           const camelKey = toCamelCase(key);
//           eventData[camelKey] = value;
//         }
//       }

//       trackEvent(eventName, eventData);
//     };

//     document.addEventListener('click', handleClick);
//     return () => document.removeEventListener('click', handleClick);
//   }, []);
// }

