import React, { useState } from 'react';
import { Artboard } from './components/Artboard';
import { ControlPanel } from './components/ControlPanel';
import { TypeSettings, DEFAULT_SETTINGS } from './types';

function App() {
  const [settings, setSettings] = useState<TypeSettings>(DEFAULT_SETTINGS);

  const updateSettings = (newSettings: Partial<TypeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black font-sans text-white">
      {/* Left: Artboard */}
      <div className="flex-1 h-full relative z-0">
        <Artboard settings={settings} />
      </div>

      {/* Right: Controls */}
      <div className="w-[400px] h-full relative z-10 shadow-2xl">
        <ControlPanel settings={settings} updateSettings={updateSettings} />
      </div>
    </div>
  );
}

export default App;
