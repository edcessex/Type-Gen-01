import React, { useRef, useMemo, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { TypeSettings } from '../types';

interface ArtboardProps {
  settings: TypeSettings;
}

interface Metaball {
  id: number;
  baseX: number; // Anchor X
  baseY: number; // Anchor Y
  r: number;     // Radius
  phase: number; // Animation phase offset
  speed: number; // Individual speed variance
}

export const Artboard: React.FC<ArtboardProps> = ({ settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [time, setTime] = useState(0);

  // Deterministic pseudo-random number generator
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate Base Metaballs (Anchors)
  // Only re-calculate when structural props change, not during animation frame
  const anchors = useMemo(() => {
    const balls: Metaball[] = [];
    if (settings.numMetaballs === 0) return balls;

    for (let i = 0; i < settings.numMetaballs; i++) {
      const seed1 = settings.noiseSeed * 100 + i;
      const seed2 = settings.noiseSeed * 200 + i;
      const seed3 = settings.noiseSeed * 300 + i;
      const seed4 = settings.noiseSeed * 400 + i;

      const shiftX = (pseudoRandom(seed1) - 0.5) * settings.metaballSpread; 
      const shiftY = (pseudoRandom(seed2) - 0.5) * settings.metaballSpread;
      
      const baseX = 50 + shiftX; 
      const baseY = 50 + shiftY;
      
      const r = 20 + pseudoRandom(seed3) * 60;
      const phase = pseudoRandom(seed4) * Math.PI * 2;
      const speed = 0.5 + pseudoRandom(seed1) * 0.5; // Variance

      balls.push({ id: i, baseX, baseY, r, phase, speed });
    }
    return balls;
  }, [settings.numMetaballs, settings.metaballSpread, settings.noiseSeed]);

  // Animation Loop
  useEffect(() => {
    if (settings.numMetaballs === 0 || settings.metaballSpeed === 0) return;

    let frameId: number;
    const animate = () => {
      setTime(prev => prev + 0.01 * settings.metaballSpeed);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [settings.numMetaballs, settings.metaballSpeed]);

  const downloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+xmlns:xlink/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `flux-type-source-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPNG = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(containerRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: settings.backgroundColor
      });
      const link = document.createElement('a');
      link.download = `flux-type-expanded-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

  // SVG Filter IDs
  const filterId = "abstract-filter";
  const alphaMultiplier = settings.contrast; 
  const alphaOffset = -(settings.contrast * 0.5); 
  const colorMatrixValues = `
    1 0 0 0 0
    0 1 0 0 0
    0 0 1 0 0
    0 0 0 ${alphaMultiplier} ${alphaOffset}
  `;

  const lines = settings.text.split('\n');
  const fontUrl = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;700&family=Syne:wght@400;700;800&family=Inter:wght@400;900&family=Rubik+Mono+One&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lobster&family=Cinzel:wght@400;700&family=Righteous&display=swap";

  // Filter Logic Construction
  const renderFilterContent = () => {
    return (
      <>
        {/* Stage 1: Shape Generation (Morph -> Noise -> Distort) */}
        {settings.morphRadius > 0 && (
          <feMorphology operator={settings.morphOperator} radius={settings.morphRadius} result="morphed" />
        )}
        <feTurbulence type={settings.noiseType} baseFrequency={`${settings.distortionX} ${settings.distortionY}`} numOctaves="2" seed={settings.noiseSeed} result="noise" />
        <feDisplacementMap 
            in={settings.morphRadius > 0 ? "morphed" : "SourceGraphic"} 
            in2="noise" 
            scale={settings.distortionStrength} 
            xChannelSelector="R" 
            yChannelSelector="G" 
            result="distorted" 
        />

        {/* Stage 2: Gooey Logic (Blur -> Threshold) */}
        <feGaussianBlur in="distorted" stdDeviation={settings.blurStdDev} result="blurred" />
        <feColorMatrix in="blurred" type="matrix" values={colorMatrixValues} result="gooShape" />

        {/* Stage 3: Texture/Material Application */}
        {settings.textureMode === 'solid' && (
            // No extra processing, just use gooShape
            <feMerge>
                <feMergeNode in="gooShape" />
            </feMerge>
        )}

        {settings.textureMode === 'chrome' && (
            <>
                {/* Create a bump map from the goo shape for 3D lighting */}
                <feGaussianBlur in="gooShape" stdDeviation="2" result="bumpMap" />
                
                {/* Specular lighting creates the shiny metallic look */}
                <feSpecularLighting in="bumpMap" surfaceScale="5" specularConstant="1.2" specularExponent="30" lightingColor="#ffffff" result="specular">
                    <fePointLight x="-5000" y="-10000" z="20000" />
                </feSpecularLighting>

                {/* Composite lighting ON TOP of the original shape (masked) */}
                <feComposite in="specular" in2="gooShape" operator="in" result="specularMasked" />
                
                {/* Blend specular with original color */}
                <feComposite in="specularMasked" in2="gooShape" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
            </>
        )}

        {settings.textureMode === 'glass' && (
             <>
                <feGaussianBlur in="gooShape" stdDeviation="3" result="glassBump" />
                <feSpecularLighting in="glassBump" surfaceScale="5" specularConstant="1.5" specularExponent="40" lightingColor="#ffffff" result="glassSpecular">
                     <fePointLight x="-5000" y="-10000" z="20000" />
                </feSpecularLighting>
                
                {/* Reduce opacity of base shape to make it look transparent */}
                <feColorMatrix in="gooShape" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" result="transparentBase" />
                
                <feComposite in="glassSpecular" in2="gooShape" operator="in" result="glassShine" />
                <feComposite in="glassShine" in2="transparentBase" operator="over" />
             </>
        )}

        {settings.textureMode === 'neon' && (
            <>
                {/* Create multiple glows */}
                <feGaussianBlur in="gooShape" stdDeviation="2" result="glow1" />
                <feGaussianBlur in="gooShape" stdDeviation="6" result="glow2" />
                <feGaussianBlur in="gooShape" stdDeviation="12" result="glow3" />
                
                {/* Colorize glows if needed, but for now assuming input color is bright */}
                <feMerge>
                    <feMergeNode in="glow3" />
                    <feMergeNode in="glow2" />
                    <feMergeNode in="glow1" />
                    <feMergeNode in="gooShape" />
                    {/* Add a white core for intense neon look */}
                    <feMergeNode in="gooShape" /> 
                </feMerge>
            </>
        )}
      </>
    );
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden relative"
      style={{ backgroundColor: settings.backgroundColor }}
      ref={containerRef}
    >
      {/* HUD Buttons */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
         {/* PNG Button */}
         <button 
          onClick={downloadPNG}
          disabled={isExporting}
          className="bg-black/50 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-3 group"
        >
          {isExporting ? 'RENDER_BUSY' : 'EXPORT_PNG'}
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        </button>

        {/* SVG Button */}
        <button 
          onClick={downloadSVG}
          className="text-zinc-500 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          [ DOWNLOAD_SOURCE ]
        </button>
      </div>

      <div className="absolute bottom-6 left-6 z-10 text-white/20 text-[10px] font-mono pointer-events-none tracking-[0.2em] border-l border-white/20 pl-3">
        FLUX_TYPE<br/>
        GENERATOR_SYS
      </div>
      
      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{ 
          backgroundImage: 'linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)',
          backgroundSize: '50px 50px'
      }}></div>

      <svg 
        ref={svgRef}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style type="text/css">{`@import url('${fontUrl}');`}</style>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            {renderFilterContent()}
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
           <g
            style={{ 
              transformBox: 'fill-box', 
              transformOrigin: 'center center',
              transform: `rotate(${settings.rotation}deg) skewX(${settings.skewX}deg) skewY(${settings.skewY}deg)` 
            }}
           >
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              style={{
                fontFamily: settings.fontFamily,
                fontSize: `${settings.fontSize}px`,
                letterSpacing: `${settings.letterSpacing}px`,
                lineHeight: settings.lineHeight,
                fill: settings.showFill ? settings.fillColor : 'none',
                stroke: settings.showStroke ? settings.strokeColor : 'none',
                strokeWidth: settings.strokeWidth,
                whiteSpace: 'pre'
              }}
            >
               {lines.map((line, i) => (
                  <tspan key={i} x="50%" dy={i === 0 ? `-${(lines.length - 1) * settings.fontSize * settings.lineHeight * 0.5}px` : `${settings.fontSize * settings.lineHeight}px`}>
                    {line}
                  </tspan>
               ))}
            </text>
          </g>

          {/* Animated Metaballs */}
          {anchors.map((ball) => {
             const animX = ball.baseX + Math.sin(time * ball.speed + ball.phase) * 5; 
             const animY = ball.baseY + Math.cos(time * ball.speed + ball.phase) * 5;

             return (
                <circle 
                    key={ball.id}
                    cx={`${animX}%`}
                    cy={`${animY}%`}
                    r={ball.r}
                    fill={settings.showFill ? settings.fillColor : 'transparent'}
                    stroke={settings.showStroke ? settings.strokeColor : 'none'}
                    strokeWidth={settings.strokeWidth}
                />
             );
          })}
        </g>
      </svg>
    </div>
  );
};