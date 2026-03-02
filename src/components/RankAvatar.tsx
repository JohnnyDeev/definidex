import { motion } from 'motion/react';
import { getRankByContributions } from '../lib/rankUtils';

interface RankAvatarProps {
    photoURL: string | null;
    displayName: string | null;
    contributionCount: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function RankAvatar({ photoURL, displayName, contributionCount, size = 'md' }: RankAvatarProps) {
    const rank = getRankByContributions(contributionCount);

    const sizeClasses = {
        sm: 'w-8 h-8 border-2',
        md: 'w-12 h-12 border-2',
        lg: 'w-20 h-20 border-4',
        xl: 'w-32 h-32 border-[6px]'
    };

    const badgeSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    return (
        <div className="relative inline-block">
            {/* Dynamic Border/Aura */}
            <motion.div
                className={`${sizeClasses[size]} rounded-full overflow-hidden ${rank.borderColor} shadow-lg ${rank.glowColor} relative z-10`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                {photoURL ? (
                    <img
                        src={photoURL}
                        alt={displayName ?? 'Treinador'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold">
                        {(displayName ?? '?')[0].toUpperCase()}
                    </div>
                )}
            </motion.div>

            {/* Rank Badge Indicator */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -bottom-1 -right-1 z-20 ${badgeSize[size]} rounded-full border-2 border-white shadow-md`}
                style={{ backgroundColor: rank.color }}
                title={rank.name}
            />

            {/* Extra glow for high ranks */}
            {contributionCount >= 16 && (
                <motion.div
                    className={`absolute inset-0 rounded-full ${rank.glowColor} blur-md -z-10`}
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </div>
    );
}
