import { TrainerRank } from '../types';

export interface RankInfo {
    name: TrainerRank;
    minContributions: number;
    color: string;
    borderColor: string;
    glowColor: string;
}

export const RANKS: RankInfo[] = [
    {
        name: 'Pokéball',
        minContributions: 0,
        color: '#ef4444', // Red-500
        borderColor: 'border-red-500',
        glowColor: 'shadow-red-500/20'
    },
    {
        name: 'Great Ball',
        minContributions: 6,
        color: '#3b82f6', // Blue-500
        borderColor: 'border-blue-500',
        glowColor: 'shadow-blue-500/30'
    },
    {
        name: 'Ultra Ball',
        minContributions: 16,
        color: '#eab308', // Yellow-500
        borderColor: 'border-yellow-500',
        glowColor: 'shadow-yellow-500/40'
    },
    {
        name: 'Master Ball',
        minContributions: 31,
        color: '#a855f7', // Purple-500
        borderColor: 'border-purple-500',
        glowColor: 'shadow-purple-500/50'
    }
];

export function getRankByContributions(count: number): RankInfo {
    // Find the highest rank that meets the contribution requirement
    return [...RANKS].reverse().find(rank => count >= rank.minContributions) || RANKS[0];
}
