'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { generateBezierPath, Point } from './homeglobe'; // Your existing path generator
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('../../components/Globe'), {
  ssr: false,
});

const ScrollPathAnimation = () => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const redDotRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [pathLength, setPathLength] = useState(0);
  const [globeReady, setGlobeReady] = useState(false);

  const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;

  const start: Point = { x: 0.5 * width, y: 0.5 * height };
  const end: Point = { x: 0.97 * width, y: 1.5 * height };
  const path = generateBezierPath(start, end);

  const moveDotToProgress = (progress: number) => {
    if (!pathRef.current || !redDotRef.current || pathLength === 0) return;

    const length = pathLength * progress;
    const point = pathRef.current.getPointAtLength(length);

    const offsetX = redDotRef.current.offsetWidth / 2;
    const offsetY = redDotRef.current.offsetHeight / 2;

    redDotRef.current.style.transform = `translate(${point.x - offsetX}px, ${point.y - offsetY}px)`;
  };

  useEffect(() => {
    if (pathRef.current && redDotRef.current && globeReady) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);

      const point = pathRef.current.getPointAtLength(0);
      const offsetX = redDotRef.current.offsetWidth / 2;
      const offsetY = redDotRef.current.offsetHeight / 2;
      redDotRef.current.style.transform = `translate(${point.x - offsetX}px, ${point.y - offsetY}px)`;
    }
  }, [globeReady]);

  useEffect(() => {
    return smoothScroll.on('change', (v) => {
      moveDotToProgress(v);
    });
  }, [pathLength, smoothScroll]);

  useEffect(() => {
    const unsubscribe = smoothScroll.on('change', (v) => {
      console.log('Scroll progress:', v);
    });

    return () => unsubscribe();
  }, [smoothScroll]);

  // ResizeObserver to detect when Globe size is ready
  useEffect(() => {
    if (!redDotRef.current) return;

    const observer = new ResizeObserver(() => {
      if (
        redDotRef.current!.offsetWidth > 0 &&
        redDotRef.current!.offsetHeight > 0
      ) {
        setGlobeReady(true);
      }
    });

    observer.observe(redDotRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-[200vh] relative bg-white overflow-hidden">
      <div className="h-screen w-full flex items-center justify-center absolute top-0 left-0 z-10 text-black border-b border-black">
        <h1 className="text-4xl font-bold">Scroll to see the animation</h1>
      </div>
      <div className="h-screen w-full flex items-center justify-center absolute bottom-0 left-0 z-10 text-black">
        <h1 className="text-4xl font-bold">Scroll to see the animation</h1>
      </div>
      <div className="sticky top-0 h-screen w-full">
        <svg
          width={width}
          height={height * 1.6}
          className="absolute top-0 left-0 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            ref={pathRef}
            d={path}
            stroke="transparent"
            strokeWidth={0}
            fill="none"
          />
        </svg>

        <motion.div ref={redDotRef} className="w-fit h-fit" >
          <Globe />
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollPathAnimation;
