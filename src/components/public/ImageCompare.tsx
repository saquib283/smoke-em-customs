'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './ImageCompare.module.css';

interface ImageCompareProps {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt?: string;
  afterAlt?: string;
  title?: string;
}

export function ImageCompare({
  beforeUrl,
  afterUrl,
  beforeAlt = 'Before Treatment',
  afterAlt = 'After Detailing Transformation',
  title,
}: ImageCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleStop);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleStop);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleStop);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleStop]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div
        className={styles.aspectRatioBox}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* Before Image (Base Layer) */}
        <img
          src={beforeUrl}
          alt={beforeAlt}
          className={styles.beforeImage}
          loading="lazy"
        />
        <span className={styles.pillBefore}>BEFORE DEFECTS</span>

        {/* After Image (Clipped Overlay Layer) */}
        <div
          className={styles.afterWrapper}
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={afterUrl}
            alt={afterAlt}
            className={styles.afterImage}
            style={{
              width: containerRef.current
                ? `${containerRef.current.clientWidth}px`
                : '100%',
              maxWidth: 'none',
            }}
            loading="lazy"
          />
        </div>
        <span className={styles.pillAfter}>AFTER CERAMIC / PPF</span>

        {/* Draggable Divider Line & Handle */}
        <div
          className={styles.sliderLine}
          style={{ left: `${sliderPosition}%` }}
        >
          <div
            className={styles.sliderHandle}
            aria-label="Drag slider to compare before and after"
            role="slider"
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className={styles.handleIcon}>◀ ▶</span>
          </div>
        </div>
      </div>

      <div className={styles.instructions}>
        <span className={styles.instructionIcon}>↔</span>
        <span>Drag or tap the slider left and right to inspect optical clarity & swirl elimination</span>
      </div>
    </div>
  );
}
