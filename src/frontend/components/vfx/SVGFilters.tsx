/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import React from 'react';

/**
 * Global SVG Filters for VFX effects.
 * Used via CSS: filter: url(#filter-id)
 */
export default function SVGFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        {/* Force / Heavy Distortion */}
        <filter id="heavy-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="5" result="noise">
            <animate
              attributeName="baseFrequency"
              dur="1s"
              values="0.015;0.04;0.015"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="40"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Thunder / Sonic Distortion (Sidechain Kick Drum) */}
        <filter
          id="sonic-distortion"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.005 0.1"
            numOctaves="4"
            seed="0"
            result="noise"
          >
            <animate attributeName="seed" from="0" to="100" dur="10s" repeatCount="indefinite" />
          </feTurbulence>
          <feOffset dx="-50" dy="0" in="noise" result="offsetNoise">
            <animate attributeName="dx" from="-200" to="200" dur="4s" repeatCount="indefinite" />
          </feOffset>
          <feDisplacementMap
            in="SourceGraphic"
            in2="offsetNoise"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              dur="0.8s"
              values="0; 100; 20; 0; 0"
              keyTimes="0; 0.1; 0.15; 0.3; 1"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </defs>
    </svg>
  );
}
