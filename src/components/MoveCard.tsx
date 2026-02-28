import React, { useState, useEffect } from 'react';
import { typeColors } from './TypeBadge';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslatedEntry } from '../translations';
import { ptBRMoveTranslations } from '../moveTranslations';

export const MoveCard: React.FC<{ moveUrl: string, methodText: string }> = ({ moveUrl, methodText }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    fetch(moveUrl)
      .then(res => res.json())
      .then(data => {
        if (mounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [moveUrl]);

  if (loading) {
    return <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm h-[100px] animate-pulse" />;
  }

  if (!details) return null;

  const typeColor = typeColors[details.type.name] || 'bg-zinc-500 text-white';
  const entry = getTranslatedEntry(details.flavor_text_entries, language);
  let description = entry?.flavor_text.replace(/\n|\f/g, ' ') || 'No description available.';

  if (language.startsWith('pt') && ptBRMoveTranslations[details.name]) {
    description = ptBRMoveTranslations[details.name].description;
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-bold capitalize text-zinc-800 text-lg">{details.name.replace('-', ' ')}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${typeColor}`}>
            {details.type.name}
          </span>
        </div>
        <span className="text-xs font-mono bg-zinc-100 text-zinc-600 px-2 py-1 rounded capitalize font-bold">
          {methodText}
        </span>
      </div>

      <div className="flex gap-4 text-xs font-mono text-zinc-500 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
        <div className="flex flex-col">
          <span className="uppercase font-bold text-[10px] text-zinc-400">{t.power}</span>
          <span className="text-zinc-800 font-bold">{details.power || '-'}</span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase font-bold text-[10px] text-zinc-400">{t.accuracy}</span>
          <span className="text-zinc-800 font-bold">{details.accuracy ? `${details.accuracy}%` : '-'}</span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase font-bold text-[10px] text-zinc-400">PP</span>
          <span className="text-zinc-800 font-bold">{details.pp}</span>
        </div>
        <div className="flex flex-col">
          <span className="uppercase font-bold text-[10px] text-zinc-400">{t.class}</span>
          <span className="text-zinc-800 font-bold capitalize">{details.damage_class.name}</span>
        </div>
      </div>

      <p className="text-sm text-zinc-600 leading-relaxed mt-1">
        {description}
      </p>
    </div>
  );
}
