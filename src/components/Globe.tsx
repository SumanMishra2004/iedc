'use client';

import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

type GeoFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
    pop_max: number;
    latitude: number;
    longitude: number;
  };
};



interface GlobeProps {
  scrollValue: number;
}
const World: React.FC<GlobeProps> = ({ scrollValue }) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 700, height: 700 });
  const [places, setPlaces] = useState<GeoFeature[]>([]);
  const [allArcs, setAllArcs] = useState<any[]>([]);
  const [currentArcIndex, setCurrentArcIndex] = useState(0);

useEffect(() => {
  const updateSize = () => {
    if (containerRef.current) {
      // Calculate width based on scrollValue interpolation between 300 and 700
      const minSize = 650;
      const maxSize = 1000;

      // clamp scrollValue to [0,1] just in case
      const clampedScroll = Math.min(Math.max(scrollValue, 0), 1);

      // interpolate size based on scrollValue
      const interpolatedSize = minSize + (maxSize - minSize) * clampedScroll;

      setSize({ width: interpolatedSize, height: interpolatedSize });
    }
  };

  updateSize();

  const handleResize = () => requestAnimationFrame(updateSize);
  window.addEventListener('resize', handleResize);

  return () => window.removeEventListener('resize', handleResize);
}, [scrollValue]);
  // Load data and setup globe
  useEffect(() => {
    const loadData = async () => {
      const res = await fetch('/ne_110m_populated_places_simple.geojson');
      const data = await res.json();
      const features: GeoFeature[] = data.features;

      const top20 = features
        .sort((a, b) => b.properties.pop_max - a.properties.pop_max)
        .slice(0, 20);
      setPlaces(top20);

      const arcConnections: any[] = [];
      const usedPairs = new Set<string>();
      const arcCount = 30;

      while (arcConnections.length < arcCount) {
        const startIdx = Math.floor(Math.random() * top20.length);
        let endIdx = Math.floor(Math.random() * top20.length);
        while (endIdx === startIdx) {
          endIdx = Math.floor(Math.random() * top20.length);
        }

        const pairKey = `${startIdx}-${endIdx}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);

        const start = top20[startIdx].properties;
        const end = top20[endIdx].properties;

        arcConnections.push({
          startLat: start.latitude,
          startLng: start.longitude,
          endLat: end.latitude,
          endLng: end.longitude,
          color: '#79fffd',
          stroke: 0.9,
        });
      }

      setAllArcs(arcConnections);
    };

    loadData();
  }, []);

  // Configure globe
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Transparent base globe
    const globeMesh = globe.scene().children.find(
      (obj: any) => obj.type === 'Mesh' && obj.geometry.type === 'SphereGeometry'
    );

    if (globeMesh && globeMesh.material) {
      globeMesh.material.transparent = true;
      globeMesh.material.opacity = 0;
    }

    globe.renderer().setClearColor(0x000000, 0);

    // Controls
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = true;

    // Initial view
    globe.pointOfView(
      {
        lat: 20.5937,
        lng: 78.9629,
        altitude: 2.5,
      },
      0
    );

    // Add rotating clouds
    const CLOUDS_IMG_URL = './clouds.png';
    new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(globe.getGlobeRadius() * 1.004, 75, 75),
        new THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        })
      );

      clouds.renderOrder = 0;
      globe.scene().add(clouds);

      // Cloud animation
      const rotateClouds = () => {
        clouds.rotation.y += (-0.006 * Math.PI) / 180;
        requestAnimationFrame(rotateClouds);
      };
      rotateClouds();

      // Adjust sprite render order
      setTimeout(() => {
        globe.scene().children.forEach((child: any) => {
          if (child instanceof THREE.Sprite) {
            child.renderOrder = 1;
          }
        });
      }, 500);
    });
  }, [places]);

  // Get visible arcs (pagination)
  const getVisibleArcs = () => {
    const visibleCount = 7;
    const start = currentArcIndex;
    const end = currentArcIndex + visibleCount;

    if (end <= allArcs.length) {
      return allArcs.slice(start, end);
    } else {
      return [...allArcs.slice(start), ...allArcs.slice(0, end % allArcs.length)];
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 20 }}>

   
    <div
      ref={containerRef}
      className=" w-fit aspect-square overflow-hidden z-20 relative"
    >
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0, 0, 0, 0)"
        width={size.width}
        height={size.height}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
        labelsData={places}
        labelLat={(d: any) => d.properties.latitude}
        labelLng={(d: any) => d.properties.longitude}
        labelText={(d: any) => d.properties.name}
        labelSize={(d: any) => Math.sqrt(d.properties.pop_max) * 4e-4}
        labelDotRadius={(d: any) => Math.sqrt(d.properties.pop_max) * 4e-4}
        labelColor={() => 'rgba(255, 165, 0, 0.85)'}
        labelResolution={2}
        arcsData={getVisibleArcs()}
        arcColor={'color'}
        arcStroke={(d: any) => d.stroke}
        arcDashLength={0.9}
        arcDashGap={0.7}
        arcDashAnimateTime={4000}
        animateIn={true}
      />
    </div> </div>
  );
};

export default World;
