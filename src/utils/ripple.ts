import React from 'react';

/**
 * Creates an expanding ripple wave from click coordinates on a button or interactive element.
 */
export function triggerRipple(
  e: React.MouseEvent<HTMLElement> | MouseEvent | React.TouchEvent<HTMLElement> | TouchEvent | Event,
  customTarget?: HTMLElement
) {
  const anyEvent = e as any;
  const target = customTarget || (anyEvent.currentTarget as HTMLElement) || (anyEvent.target as HTMLElement);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height) * 1.5;

  let clientX: number;
  let clientY: number;

  if ('touches' in e && e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('clientX' in e && e.clientX !== 0) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    // Keyboard activation or synthetic event: emanate from center
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  const circle = document.createElement('span');
  circle.className = 'ripple-circle';
  circle.style.width = `${diameter}px`;
  circle.style.height = `${diameter}px`;
  circle.style.left = `${clientX - rect.left - diameter / 2}px`;
  circle.style.top = `${clientY - rect.top - diameter / 2}px`;

  // Detect if button background is light to apply a darker, contrastive wave
  try {
    const bg = window.getComputedStyle(target).backgroundColor;
    const m = bg.match(/\d+/g);
    if (m && m.length >= 3) {
      const luminance = 0.299 * (+m[0]) + 0.587 * (+m[1]) + 0.114 * (+m[2]);
      if (luminance > 175) {
        circle.classList.add('ripple-dark');
      }
    }
  } catch (err) {}

  // Remove existing ripple if user clicks rapidly
  const existing = target.querySelector('.ripple-circle');
  if (existing) {
    existing.remove();
  }

  target.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 650);
}

/**
 * Attaches a global listener to ensure any element with .cta, .btn-ripple, or [data-ripple]
 * receives an immediate ripple wave on click/pointerdown.
 */
export function setupGlobalRipple() {
  if (typeof document === 'undefined') return;

  const handlePointerDown = (e: PointerEvent) => {
    const target = (e.target as HTMLElement)?.closest?.('.cta, .btn-ripple, [data-ripple]') as HTMLElement;
    if (!target || (target as HTMLButtonElement).disabled) return;

    triggerRipple(e, target);
  };

  document.addEventListener('pointerdown', handlePointerDown);
  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
  };
}
