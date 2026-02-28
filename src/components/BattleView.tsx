import React from 'react';
import { motion } from 'motion/react';
import { Globe, ExternalLink, Sword, Smartphone, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function BattleView() {
    const { t } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-4"
        >
            <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-zinc-100 text-center relative overflow-hidden">
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500" />

                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-200">
                        <Sword size={40} />
                    </div>
                </div>

                <h2 className="text-3xl font-black text-zinc-900 mb-3 tracking-tight">
                    {t.battle || 'Battle Simulator'}
                </h2>

                <p className="text-zinc-500 text-sm sm:text-base mb-8 leading-relaxed">
                    {t.battleDisclaimer || "Use the simulator to test your teams! Export your team from the Team Builder and paste it into Showdown."}
                </p>

                {/* Main CTA */}
                <a
                    href="https://play.pokemonshowdown.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 text-lg"
                >
                    <Globe size={22} />
                    {t.startBattle || 'Start Battle Now'}
                    <ExternalLink size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Instructions */}
                <div className="mt-6 pt-5 border-t border-zinc-100 space-y-3">
                    <h4 className="font-bold text-zinc-700 text-sm flex items-center justify-center gap-2">
                        <Info size={16} className="text-red-500" />
                        Como usar seus times?
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Vá no <strong className="text-zinc-600">Team Builder</strong>, clique em <strong className="text-zinc-600">Exportar Showdown</strong>, e cole o texto no Showdown para lutar com seus próprios times!
                    </p>
                </div>

                {/* Mobile App Note */}
                <div className="mt-4 bg-blue-50 rounded-xl p-3 flex items-start gap-2">
                    <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-blue-600 text-left leading-relaxed">
                        <strong>App Mobile:</strong> Na versão para celular, o simulador abrirá integrado ao app sem sair da tela.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
