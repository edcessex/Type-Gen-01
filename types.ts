export enum FontFamily {
  Inter = 'Inter',
  SpaceGrotesk = 'Space Grotesk',
  Syne = 'Syne',
  RubikMonoOne = 'Rubik Mono One',
  Oswald = 'Oswald',
  PlayfairDisplay = 'Playfair Display',
  Lobster = 'Lobster',
  Cinzel = 'Cinzel',
  Righteous = 'Righteous',
  TimesNewRoman = 'Times New Roman',
  CourierNew = 'Courier New'
}

export type TextureMode = 'solid' | 'chrome' | 'glass' | 'neon';

export interface TypeSettings {
  // Content
  text: string;
  fontFamily: FontFamily;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  
  // Transform
  rotation: number;
  skewX: number;
  skewY: number;
  
  // Morphology (Dilate/Erode)
  morphRadius: number;
  morphOperator: 'dilate' | 'erode';
  
  // Distortion (Turbulence + Displacement)
  distortionX: number; // baseFrequency X
  distortionY: number; // baseFrequency Y
  distortionStrength: number; // scale
  noiseType: 'turbulence' | 'fractalNoise';
  noiseSeed: number;
  
  // Liquid/Gooey (Blur + Threshold)
  blurStdDev: number;
  contrast: number; // Alpha multiplier
  
  // Texture
  textureMode: TextureMode;

  // Metaballs
  numMetaballs: number;
  metaballSpread: number; // Cluster tightness
  metaballSpeed: number;  // Animation speed (0 to stop)

  // Style
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  showFill: boolean;
  showStroke: boolean;
  backgroundColor: string;
}

export const DEFAULT_SETTINGS: TypeSettings = {
  text: 'FLUX\nTYPE',
  fontFamily: FontFamily.Syne,
  fontSize: 120,
  letterSpacing: 0,
  lineHeight: 0.9,
  
  rotation: 0,
  skewX: 0,
  skewY: 0,
  
  morphRadius: 0,
  morphOperator: 'dilate',
  
  distortionX: 0.02,
  distortionY: 0.04,
  distortionStrength: 30,
  noiseType: 'turbulence',
  noiseSeed: 1,
  
  blurStdDev: 0,
  contrast: 1,
  
  textureMode: 'solid',
  
  numMetaballs: 5,
  metaballSpread: 40,
  metaballSpeed: 0.2,

  fillColor: '#FFFFFF',
  strokeColor: '#FF0055',
  strokeWidth: 2,
  showFill: true,
  showStroke: false,
  backgroundColor: '#000000'
};