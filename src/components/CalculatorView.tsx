import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, ExternalLink, Maximize2, Minimize2, ZoomOut, ZoomIn } from 'lucide-react';

const ZOOM_LEVELS = [
    { label: '50%', scale: 0.5 },
    { label: '60%', scale: 0.6 },
    { label: '70%', scale: 0.7 },
    { label: '80%', scale: 0.8 },
    { label: '90%', scale: 0.9 },
    { label: '100%', scale: 1.0 },
];

export function CalculatorView() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomIndex, setZoomIndex] = useState(2); // Start at 70%

    const currentZoom = ZOOM_LEVELS[zoomIndex];
    const inverseScale = 1 / currentZoom.scale;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-900' : 'h-[calc(100vh-4rem)]'}`}
        >
            {/* Compact Toolbar */}
            <div className={`flex items-center justify-between px-3 py-1.5 shrink-0 ${isFullscreen ? 'bg-zinc-900 border-b border-zinc-700' : 'bg-white/90 backdrop-blur border-b border-zinc-200'}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${isFullscreen ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                        <Calculator size={14} />
                    </div>
                    <span className={`text-xs font-bold ${isFullscreen ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        Calculadora de Dano
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {/* Zoom controls */}
                    <button
                        onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
                        disabled={zoomIndex === 0}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isFullscreen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Diminuir zoom"
                    >
                        <ZoomOut size={14} />
                    </button>
                    <span className={`text-[10px] font-bold min-w-[32px] text-center ${isFullscreen ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {currentZoom.label}
                    </span>
                    <button
                        onClick={() => setZoomIndex(Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1))}
                        disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isFullscreen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Aumentar zoom"
                    >
                        <ZoomIn size={14} />
                    </button>

                    <div className={`w-px h-4 mx-1 ${isFullscreen ? 'bg-zinc-700' : 'bg-zinc-200'}`} />

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={`p-1.5 rounded-lg transition-colors ${isFullscreen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}`}
                        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                    >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <a
                        href="https://calc.pokemonshowdown.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1.5 rounded-lg transition-colors ${isFullscreen ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Abrir em nova aba"
                    >
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            {/* Iframe with zoom-out scaling */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <iframe
                    src="https://calc.pokemonshowdown.com/"
                    title="Pokémon Showdown Damage Calculator"
                    className="border-none absolute top-0 left-0"
                    style={{
                        width: `${100 * inverseScale}%`,
                        height: `${100 * inverseScale}%`,
                        transform: `scale(${currentZoom.scale})`,
                        transformOrigin: 'top left',
                    }}
                />
            </div>
        </motion.div>
    );
}
