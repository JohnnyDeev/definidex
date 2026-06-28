import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Calculator, Swords, Shield, Settings, TrendingUp,
    ArrowLeftRight, RotateCcw
} from 'lucide-react';
import { useDamageCalculator } from '../hooks/useDamageCalculator';
import { CalculatorPokemonCard } from './calculator/CalculatorPokemonCard';
import { FieldConditions } from './calculator/FieldConditions';
import { DamageResult } from './calculator/DamageResult';
import { Card } from './calculator/CalculatorControls';
import { useLanguage } from '../contexts/LanguageContext';

type Tab = 'calculator' | 'field' | 'results';

export function CalculatorView() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('calculator');

    const {
        generation,
        attacker,
        defender,
        field,
        results,
        speciesList,
        movesList,
        itemsList,
        abilitiesList,
        setGeneration,
        updateAttacker,
        updateDefender,
        updateField,
        updateSide,
        getPokemonMoves,
        swapPokemon,
        reset,
    } = useDamageCalculator();

    const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        {
            id: 'calculator',
            label: 'Calculadora',
            icon: <Calculator size={16} />,
        },
        {
            id: 'field',
            label: 'Campo',
            icon: <Settings size={16} />,
        },
        {
            id: 'results',
            label: 'Resultados',
            icon: <TrendingUp size={16} />,
            badge: results ? results.length : 0,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[calc(100vh-4rem)] flex flex-col"
        >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b bg-white/90 backdrop-blur border-zinc-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-100 text-red-600">
                        <Calculator size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-zinc-700 uppercase tracking-tight">
                            Calculadora de Dano
                        </h2>
                        <p className="text-[10px] font-medium text-zinc-500">
                            Geração {generation}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Generation Selector */}
                    <select
                        value={generation}
                        onChange={e => setGeneration(Number(e.target.value) as any)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 bg-white border-zinc-200 text-zinc-700 appearance-none cursor-pointer"
                    >
                        {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(gen => (
                            <option key={gen} value={gen}>Gen {gen}</option>
                        ))}
                    </select>

                    <div className="w-px h-6 mx-1 bg-zinc-200" />

                    {/* Reset */}
                    <button
                        onClick={reset}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Resetar"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="flex md:hidden border-b border-zinc-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors relative ${activeTab === tab.id
                            ? 'text-red-600 bg-red-50'
                            : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge ? (
                            <span className="absolute -top-1 right-1/2 translate-x-4 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {tab.badge}
                            </span>
                        ) : null}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                        {/* Desktop: Show all side by side */}
                        <div className="hidden lg:grid grid-cols-3 gap-6">
                            {/* Left Column - Attacker & Defender */}
                            <div className="space-y-4">
                                <Card
                                    title="Atacante"
                                    icon={<Swords size={18} />}
                                    headerAction={
                                        <button
                                            onClick={swapPokemon}
                                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                            title="Trocar atacante/defensor"
                                        >
                                            <ArrowLeftRight size={14} />
                                        </button>
                                    }
                                >
                                    <CalculatorPokemonCard
                                        side="attacker"
                                        pokemon={attacker}
                                        onChange={updateAttacker}
                                        speciesList={speciesList}
                                        movesList={movesList}
                                        itemsList={itemsList}
                                        abilitiesList={abilitiesList}
                                        getPokemonMoves={getPokemonMoves}
                                        generation={generation}
                                    />
                                </Card>
                            </div>

                            {/* Middle Column - Results & Field */}
                            <div className="space-y-4">
                                <Card
                                    title="Resultado"
                                    icon={<TrendingUp size={18} />}
                                >
                                    <DamageResult
                                        results={results}
                                        attackerName={attacker.species}
                                        defenderName={defender.species}
                                    />
                                </Card>

                                <Card
                                    title="Campo"
                                    icon={<Settings size={18} />}
                                >
                                    <FieldConditions
                                        field={field}
                                        onUpdate={updateField}
                                        onUpdateSide={updateSide}
                                    />
                                </Card>
                            </div>

                            {/* Right Column - Defender */}
                            <div className="space-y-4">
                                <Card
                                    title="Defensor"
                                    icon={<Shield size={18} />}
                                >
                                    <CalculatorPokemonCard
                                        side="defender"
                                        pokemon={defender}
                                        onChange={updateDefender}
                                        speciesList={speciesList}
                                        movesList={movesList}
                                        itemsList={itemsList}
                                        abilitiesList={abilitiesList}
                                        getPokemonMoves={getPokemonMoves}
                                        generation={generation}
                                    />
                                </Card>
                            </div>
                        </div>

                        {/* Mobile/Tablet: Tabbed view */}
                        <div className="lg:hidden">
                            <AnimatePresence mode="wait">
                                {activeTab === 'calculator' && (
                                    <motion.div
                                        key="calculator"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        <Card
                                            title="Atacante"
                                            icon={<Swords size={18} />}
                                            headerAction={
                                                <button
                                                    onClick={swapPokemon}
                                                    className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                >
                                                    <ArrowLeftRight size={14} />
                                                </button>
                                            }
                                        >
                                            <CalculatorPokemonCard
                                                side="attacker"
                                                pokemon={attacker}
                                                onChange={updateAttacker}
                                                speciesList={speciesList}
                                                movesList={movesList}
                                                itemsList={itemsList}
                                                abilitiesList={abilitiesList}
                                                getPokemonMoves={getPokemonMoves}
                                                generation={generation}
                                            />
                                        </Card>

                                        <Card
                                            title="Defensor"
                                            icon={<Shield size={18} />}
                                        >
                                            <CalculatorPokemonCard
                                                side="defender"
                                                pokemon={defender}
                                                onChange={updateDefender}
                                                speciesList={speciesList}
                                                movesList={movesList}
                                                itemsList={itemsList}
                                                abilitiesList={abilitiesList}
                                                getPokemonMoves={getPokemonMoves}
                                                generation={generation}
                                            />
                                        </Card>
                                    </motion.div>
                                )}

                                {activeTab === 'field' && (
                                    <motion.div
                                        key="field"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <Card
                                            title="Condições do Campo"
                                            icon={<Settings size={18} />}
                                        >
                                            <FieldConditions
                                                field={field}
                                                onUpdate={updateField}
                                                onUpdateSide={updateSide}
                                            />
                                        </Card>
                                    </motion.div>
                                )}

                                {activeTab === 'results' && (
                                    <motion.div
                                        key="results"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <Card
                                            title="Resultado da Batalha"
                                            icon={<TrendingUp size={18} />}
                                        >
                                            <DamageResult
                                                results={results}
                                                attackerName={attacker.species}
                                                defenderName={defender.species}
                                            />
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
}
