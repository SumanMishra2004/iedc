"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { generateBezierPath, Point } from "./homeglobe";
import dynamic from "next/dynamic";
import { Meteors } from "@/components/ui/meteors";

const Globe = dynamic(() => import("../../components/Globe"), {
  ssr: false,
});

const ScrollPathAnimation = () => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const redDotRef = useRef<HTMLDivElement | null>(null);
  const [scrollValue, setScrollValue] = useState(0.0);
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });
  const [pathLength, setPathLength] = useState(0);
  const [globeReady, setGlobeReady] = useState(false);

  const width = typeof window !== "undefined" ? window.innerWidth : 1000;
  const height = typeof window !== "undefined" ? window.innerHeight : 800;

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
    return smoothScroll.on("change", (v) => {
      moveDotToProgress(v);
    });
  }, [pathLength, smoothScroll]);

  useEffect(() => {
    const unsubscribe = smoothScroll.on("change", (v) => {
      setScrollValue(v);
    });

    return () => unsubscribe();
  }, [smoothScroll]);

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
    <div className="h-[200vh] relative overflow-hidden">
      {/* Background Layers */}
      <div
        className="absolute top-0 left-0 w-full h-[100vh] z-[-2]"
       style={{
          background:
            "radial-gradient(circle, rgba(0, 135, 131, 0.2) 0%, rgba(6, 6, 6, 0.5) 33%, rgba(1, 1, 6, 0.6) 77%, rgba(0, 0, 0, 0.8) 99%)",
        }}
      />
      <div
        className="absolute top-[100vh] left-0 w-full h-[100vh]  z-[-2]   "
        style={{
          background:
            "radial-gradient(circle, rgba(0, 135, 131, 0.2) 0%, rgba(6, 6, 6, 0.5) 33%, rgba(1, 1, 6, 0.6) 77%, rgba(0, 0, 0, 0.8) 99%)",
        }}
      />

      <div className="absolute top-0 left-0 w-full h-screen bg-[url('/star.jpg')] bg-cover bg-center bg-no-repeat z-[-10]">

            {/* Meaty part - Meteor effect */}
            <Meteors number={50} />
      </div>
          

      {/* Sticky scroll area */}
      <div className="sticky top-0 h-screen w-full z-10">
        {/* SVG Path */}
        <svg
          width={width}
          height={height * 1.6}
          className="absolute top-0 left-0 pointer-events-none z-0"
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

        {/* Globe */}
        <motion.div ref={redDotRef} className="w-fit h-fit z-10">
          <Globe scrollValue={scrollValue} />
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollPathAnimation;
