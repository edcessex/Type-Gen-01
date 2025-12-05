import React, { useState } from 'react';
import { TypeSettings, FontFamily, TextureMode } from '../types';
import { generateStyleFromPrompt } from '../services/geminiService';

interface ControlPanelProps {
  settings: TypeSettings;
  updateSettings: (newSettings: Partial<TypeSettings>) => void;
}

// HUD Components
const HUDLabel = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2 font-mono">
    {children}
  </label>
);

const HUDValue = ({ children }: { children?: React.ReactNode }) => (
  <span className="text-[10px] font-mono text-zinc-300 bg-zinc-900 px-1 border border-zinc-800">
    {children}
  </span>
);

const HUDSlider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void }) => (
  <div className="mb-5 group">
    <div className="flex justify-between items-center mb-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium group-hover:text-white transition-colors">{label}</div>
      <HUDValue>{value.toFixed(step < 0.1 ? 3 : 1)}</HUDValue>
    </div>
    <div className="relative h-4 flex items-center">
        <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-[2px] bg-zinc-800 appearance-none cursor-pointer focus:outline-none 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-2 
                    [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:bg-white 
                    [&::-webkit-slider-thumb]:border 
                    [&::-webkit-slider-thumb]:border-zinc-500
                    hover:[&::-webkit-slider-thumb]:bg-zinc-200"
        />
    </div>
  </div>
);

const HUDSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="border-t border-zinc-800 pt-4 mb-6">
    <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-1 bg-white"></div>
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
        {title}
        </h3>
    </div>
    {children}
  </div>
);

const HUDBtn = ({ children, active, onClick }: { children?: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-mono border transition-all
    ${active 
        ? 'bg-white text-black border-white font-bold' 
        : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, updateSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newStyle = await generateStyleFromPrompt(prompt, settings);
      updateSettings(newStyle);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const textureModes: TextureMode[] = ['solid', 'chrome', 'glass', 'neon'];

  return (
    <div className="w-full h-full bg-[#050505] border-l border-zinc-800 overflow-y-auto font-sans">
      
      {/* Header */}
      <div className="p-6 pb-0 mb-6">
          <h1 className="text-sm font-mono text-white tracking-widest border-b border-white/20 pb-4 mb-1">
              FLUX_TYPE <span className="text-zinc-600">// v2.5</span>
          </h1>
          <div className="flex justify-between text-[9px] text-zinc-600 font-mono uppercase">
              <span>System: Ready</span>
              <span>{new Date().toLocaleDateString()}</span>
          </div>
      </div>

      <div className="px-6 pb-12">
        {/* AI Interface */}
        <div className="mb-8 relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-zinc-700 to-zinc-900 rounded opacity-20 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-black border border-zinc-800 p-1">
                <textarea 
                className="w-full bg-zinc-900/50 text-white p-3 text-xs font-mono focus:outline-none resize-none h-20 placeholder-zinc-700"
                placeholder="PROMPT_COMMAND..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                />
                <button
                onClick={handleAiGenerate}
                disabled={isGenerating || !prompt}
                className={`w-full py-2 mt-1 text-[10px] font-bold font-mono uppercase tracking-widest transition-all border
                    ${isGenerating 
                    ? 'bg-zinc-800 text-zinc-500 border-zinc-800 cursor-wait' 
                    : 'bg-white text-black border-white hover:bg-zinc-200'
                    }`}
                >
                {isGenerating ? 'PROCESSING...' : 'EXECUTE_GENERATE'}
                </button>
            </div>
        </div>

        {/* Content */}
        <HUDSection title="Input_Data">
            <div className="mb-4">
            <HUDLabel>Text_Content</HUDLabel>
            <textarea
                value={settings.text}
                onChange={(e) => updateSettings({ text: e.target.value })}
                className="w-full bg-black border border-zinc-800 p-2 text-sm text-white font-mono focus:border-white focus:outline-none transition-colors"
                rows={2}
            />
            </div>
            <div className="mb-4">
            <HUDLabel>Typeface</HUDLabel>
            <div className="relative">
                <select 
                    value={settings.fontFamily} 
                    onChange={(e) => updateSettings({ fontFamily: e.target.value as FontFamily })}
                    className="w-full bg-black border border-zinc-800 text-white text-xs p-2 font-mono appearance-none focus:border-white focus:outline-none rounded-none"
                >
                    {Object.values(FontFamily).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[8px]">▼</div>
            </div>
            </div>
            <HUDSlider label="Size_Px" value={settings.fontSize} min={20} max={400} step={1} onChange={(v) => updateSettings({ fontSize: v })} />
            <HUDSlider label="Tracking" value={settings.letterSpacing} min={-20} max={50} step={1} onChange={(v) => updateSettings({ letterSpacing: v })} />
            <HUDSlider label="Leading" value={settings.lineHeight} min={0.5} max={3} step={0.1} onChange={(v) => updateSettings({ lineHeight: v })} />
        </HUDSection>

        {/* Style & Material */}
        <HUDSection title="Render_Material">
            <HUDLabel>Texture_Mode</HUDLabel>
            <div className="grid grid-cols-2 gap-[-1px] mb-6">
                {textureModes.map(mode => (
                    <HUDBtn
                        key={mode}
                        active={settings.textureMode === mode}
                        onClick={() => updateSettings({ textureMode: mode })}
                    >
                        {mode}
                    </HUDBtn>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="flex items-center justify-between border border-zinc-800 p-2 bg-black">
                    <HUDLabel>Fill</HUDLabel>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" className="accent-white" checked={settings.showFill} onChange={(e) => updateSettings({ showFill: e.target.checked })} />
                        <input type="color" value={settings.fillColor} onChange={(e) => updateSettings({ fillColor: e.target.value })} className="w-6 h-6 bg-transparent border-none" />
                    </div>
                </div>
                <div className="flex items-center justify-between border border-zinc-800 p-2 bg-black">
                    <HUDLabel>Stroke</HUDLabel>
                    <div className="flex items-center gap-2">
                         <input type="checkbox" className="accent-white" checked={settings.showStroke} onChange={(e) => updateSettings({ showStroke: e.target.checked })} />
                         <input type="color" value={settings.strokeColor} onChange={(e) => updateSettings({ strokeColor: e.target.value })} className="w-6 h-6 bg-transparent border-none" />
                    </div>
                </div>
                <div className="flex items-center justify-between border border-zinc-800 p-2 bg-black">
                    <HUDLabel>Background</HUDLabel>
                    <input type="color" value={settings.backgroundColor} onChange={(e) => updateSettings({ backgroundColor: e.target.value })} className="w-6 h-6 bg-transparent border-none" />
                </div>
            </div>
            <HUDSlider label="Stroke_Width" value={settings.strokeWidth} min={0} max={10} step={0.5} onChange={(v) => updateSettings({ strokeWidth: v })} />
        </HUDSection>

        {/* Metaballs */}
        <HUDSection title="Fluid_Dynamics">
            <HUDSlider label="Particle_Count" value={settings.numMetaballs} min={0} max={20} step={1} onChange={(v) => updateSettings({ numMetaballs: v })} />
            <HUDSlider label="Dispersion" value={settings.metaballSpread} min={0} max={100} step={1} onChange={(v) => updateSettings({ metaballSpread: v })} />
            <HUDSlider label="Flow_Rate" value={settings.metaballSpeed} min={0} max={2} step={0.1} onChange={(v) => updateSettings({ metaballSpeed: v })} />
        </HUDSection>

        {/* Distortion */}
        <HUDSection title="Signal_Noise">
            <div className="flex gap-[-1px] mb-6">
                <HUDBtn 
                active={settings.noiseType === 'turbulence'} 
                onClick={() => updateSettings({ noiseType: 'turbulence' })}
                >Turbulence</HUDBtn>
                <HUDBtn 
                active={settings.noiseType === 'fractalNoise'} 
                onClick={() => updateSettings({ noiseType: 'fractalNoise' })}
                >Fractal</HUDBtn>
            </div>
            <HUDSlider label="Freq_X" value={settings.distortionX} min={0} max={0.2} step={0.001} onChange={(v) => updateSettings({ distortionX: v })} />
            <HUDSlider label="Freq_Y" value={settings.distortionY} min={0} max={0.2} step={0.001} onChange={(v) => updateSettings({ distortionY: v })} />
            <HUDSlider label="Amplitude" value={settings.distortionStrength} min={0} max={200} step={1} onChange={(v) => updateSettings({ distortionStrength: v })} />
            <HUDSlider label="Seed_Val" value={settings.noiseSeed} min={1} max={100} step={1} onChange={(v) => updateSettings({ noiseSeed: v })} />
        </HUDSection>

        {/* Morphology */}
        <HUDSection title="Morphology">
            <div className="flex gap-[-1px] mb-6">
                <HUDBtn 
                active={settings.morphOperator === 'dilate'} 
                onClick={() => updateSettings({ morphOperator: 'dilate' })}
                >Dilate</HUDBtn>
                <HUDBtn 
                active={settings.morphOperator === 'erode'} 
                onClick={() => updateSettings({ morphOperator: 'erode' })}
                >Erode</HUDBtn>
            </div>
            <HUDSlider label="Radius" value={settings.morphRadius} min={0} max={20} step={0.1} onChange={(v) => updateSettings({ morphRadius: v })} />
            
            <div className="mt-8 mb-2 border-t border-dashed border-zinc-800 pt-4">
                <HUDLabel>Liquid_Processor</HUDLabel>
            </div>
            <HUDSlider label="Blur_Amount" value={settings.blurStdDev} min={0} max={30} step={0.1} onChange={(v) => updateSettings({ blurStdDev: v })} />
            <HUDSlider label="Contrast" value={settings.contrast} min={1} max={100} step={1} onChange={(v) => updateSettings({ contrast: v })} />
        </HUDSection>

        {/* Geometry */}
        <HUDSection title="Transform">
            <HUDSlider label="Rotate_Deg" value={settings.rotation} min={-180} max={180} step={1} onChange={(v) => updateSettings({ rotation: v })} />
            <HUDSlider label="Skew_X" value={settings.skewX} min={-50} max={50} step={1} onChange={(v) => updateSettings({ skewX: v })} />
            <HUDSlider label="Skew_Y" value={settings.skewY} min={-50} max={50} step={1} onChange={(v) => updateSettings({ skewY: v })} />
        </HUDSection>
      </div>
    </div>
  );
};