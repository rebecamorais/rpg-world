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
              dur="4s"
              values="0.015;0.04;0.015"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="50"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Thunder / Sonic Distortion (High frequency, lower scale) */}
        <filter id="sonic-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="noise">
            <animate
              attributeName="baseFrequency"
              dur="0.2s"
              values="0.1;0.15;0.1"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
