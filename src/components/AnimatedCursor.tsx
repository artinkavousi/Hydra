import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CURSOR_SIZE = 28;
const CURSOR_ACTIVE_SIZE = 44;
const CURSOR_COLOR = 'rgba(80,200,255,0.85)';
const CURSOR_ACTIVE_COLOR = 'rgba(255,120,200,0.85)';

export const AnimatedCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring for cursor movement
  const springX = useSpring(mouseX, { stiffness: 400, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 400, damping: 28 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX - CURSOR_SIZE / 2);
      mouseY.set(e.clientY - CURSOR_SIZE / 2);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [mouseX, mouseY]);

  // Detect clicks for active state
  useEffect(() => {
    const down = () => setIsActive(true);
    const up = () => setIsActive(false);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  // Detect hovering interactive elements
  useEffect(() => {
    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('button, a, input, [role="button"], .interactive, canvas')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mousemove', checkHover);
    return () => window.removeEventListener('mousemove', checkHover);
  }, []);

  // Hide default cursor
  useEffect(() => {
    document.body.style.cursor = 'none';
    return () => { document.body.style.cursor = ''; };
  }, []);

  return (
    <motion.div
      ref={cursorRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: CURSOR_SIZE,
        height: CURSOR_SIZE,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9999,
        x: springX,
        y: springY,
        background: isActive
          ? CURSOR_ACTIVE_COLOR
          : isHovering
          ? CURSOR_COLOR
          : 'rgba(255,255,255,0.18)',
        boxShadow: isActive
          ? '0 0 24px 8px rgba(255,120,200,0.25)'
          : isHovering
          ? '0 0 16px 4px rgba(80,200,255,0.18)'
          : '0 0 8px 2px rgba(0,0,0,0.08)',
        border: isActive
          ? '2px solid #fff'
          : isHovering
          ? '2px solid #50c8ff'
          : '2px solid #fff',
        mixBlendMode: 'exclusion',
        scale: isActive
          ? CURSOR_ACTIVE_SIZE / CURSOR_SIZE
          : isHovering
          ? 1.3
          : 1,
        transition: 'background 0.18s, box-shadow 0.18s, border 0.18s',
      }}
      animate={{
        scale: isActive
          ? CURSOR_ACTIVE_SIZE / CURSOR_SIZE
          : isHovering
          ? 1.3
          : 1,
      }}
    />
  );
}; 