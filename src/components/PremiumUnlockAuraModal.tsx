import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Key, Sparkles, Crown, Zap, Check } from 'lucide-react';

interface PremiumUnlockAuraModalProps {
  plan: 'free' | 'pro' | 'team';
  onClose: () => void;
}

export const PremiumUnlockAuraModal: React.FC<PremiumUnlockAuraModalProps> = ({ plan, onClose }) => {
  const [animationStep, setAnimationStep] = useState<'initial' | 'inserting' | 'rotating' | 'unlocked' | 'auraburst'>('initial');
  const [showContent, setShowContent] = useState<boolean>(false);

  // Auto progression of visual phases
  useEffect(() => {
    // Step 1: Fly in and hover
    const t1 = setTimeout(() => {
      setAnimationStep('inserting');
    }, 1200);

    // Step 2: Key slots and rotates
    const t2 = setTimeout(() => {
      setAnimationStep('rotating');
    }, 2800);

    // Step 3: Shackle snaps open
    const t3 = setTimeout(() => {
      setAnimationStep('unlocked');
    }, 3900);

    // Step 4: Golden aura explosion wave!
    const t4 = setTimeout(() => {
      setAnimationStep('auraburst');
      setShowContent(true);
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const isTeam = plan === 'team';
  const accentColor = isTeam ? 'from-amber-400 via-yellow-400 to-amber-600' : 'from-indigo-500 via-violet-500 to-purple-600';
  const shadowColor = isTeam ? 'shadow-amber-500/55' : 'shadow-indigo-500/55';
  const ringGlow = isTeam ? 'border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)]' : 'border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.6)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl overflow-hidden select-none">
      {/* Immersive radial space glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/4 -left-1/4 w-[150vw] h-[150vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_60%)]`} />
        {animationStep === 'auraburst' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2.5, 4], opacity: [0, 0.45, 0] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr ${accentColor} blur-3xl`}
          />
        )}
      </div>

      {/* Floating Aura Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 42 }).map((_, idx) => (
          <motion.div
            key={idx}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight + window.innerHeight,
              scale: Math.random() * 0.8 + 0.4,
              opacity: 0 
            }}
            animate={animationStep === 'auraburst' ? {
              y: [null, Math.random() * -500 - 100],
              x: [null, Math.random() * window.innerWidth],
              rotate: [0, Math.random() * 360],
              opacity: [0, 0.85, 0],
            } : {}}
            transition={{ 
              duration: Math.random() * 3 + 1.5, 
              repeat: Infinity,
              delay: Math.random() * 0.5 
            }}
            className={`absolute w-1.5 h-1.5 rounded-full ${isTeam ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,1)]'}`}
          />
        ))}
      </div>

      <div className="relative max-w-lg w-full mx-4 p-8 flex flex-col items-center justify-center text-center">
        {/* Core Lock and Key Animation Stage */}
        <div className="relative w-72 h-64 flex items-center justify-center mb-8">
          
          {/* Circular system background aura */}
          <motion.div 
            animate={animationStep === 'auraburst' ? { scale: [1, 1.25, 1.15], rotate: 360 } : { scale: 1 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            className={`absolute w-44 h-44 rounded-full border border-dashed border-slate-800 flex items-center justify-center`}
          >
            <div className="w-36 h-36 rounded-full border border-slate-900 bg-slate-950/80" />
          </motion.div>

          {/* Glowing Aura Rings */}
          <AnimatePresence>
            {animationStep === 'auraburst' && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0.25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                  className={`absolute w-44 h-44 rounded-full border-2 ${isTeam ? 'border-amber-400' : 'border-indigo-400'} blur-md`}
                />
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  className={`absolute w-44 h-44 rounded-full border-4 ${isTeam ? 'border-amber-300' : 'border-indigo-300'} opacity-30`}
                />
              </>
            )}
          </AnimatePresence>

          {/* Key Component */}
          <AnimatePresence>
            {animationStep !== 'auraburst' && (
              <motion.div
                initial={{ x: -140, y: -20, rotate: -45, scale: 0.6, opacity: 0 }}
                animate={
                  animationStep === 'initial' ? { x: -100, y: 0, rotate: 0, scale: 1, opacity: 1 } :
                  animationStep === 'inserting' ? { x: -28, y: 4, rotate: 0, scale: 0.8, opacity: 1 } :
                  animationStep === 'rotating' ? { x: -28, y: 4, rotate: 90, scale: 0.8, opacity: 1 } :
                  { x: -10, y: 4, rotate: 90, scale: 0.4, opacity: 0 }
                }
                transition={{ 
                  duration: animationStep === 'rotating' ? 0.7 : 0.9, 
                  ease: 'easeInOut' 
                }}
                className="absolute z-20"
              >
                <div className={`p-3.5 rounded-full bg-slate-900 border ${isTeam ? 'border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-indigo-400 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'} flex items-center justify-center`}>
                  <Key className="w-8 h-8 animate-pulse" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lock Component */}
          <motion.div
            animate={
              animationStep === 'rotating' ? { rotate: [0, -10, 10, 0], scale: 1.05 } : 
              animationStep === 'unlocked' ? { y: [0, -5, 0], scale: 1.1 } : 
              animationStep === 'auraburst' ? { scale: 0, opacity: 0 } : {}
            }
            transition={{ duration: 0.35 }}
            className={`absolute z-10 p-5 rounded-2xl bg-slate-900 border ${animationStep === 'unlocked' || animationStep === 'rotating' ? ringGlow : 'border-slate-800'} flex items-center justify-center`}
          >
            {animationStep === 'unlocked' || animationStep === 'rotating' ? (
              <Unlock className={`w-14 h-14 ${isTeam ? 'text-amber-400' : 'text-indigo-400'} animate-bounce`} />
            ) : (
              <Lock className="w-14 h-14 text-slate-400" />
            )}
          </motion.div>

          {/* Premium Logo Aura Reveal */}
          {animationStep === 'auraburst' && (
            <motion.div
              initial={{ scale: 0.2, rotate: -180, opacity: 0 }}
              animate={{ scale: 1.25, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 80 }}
              className="absolute z-20 flex flex-col items-center"
            >
              <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${accentColor} p-0.5 shadow-xl ${shadowColor} flex items-center justify-center`}>
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <Crown className={`w-10 h-10 ${isTeam ? 'text-amber-400' : 'text-indigo-400'} animate-pulse`} />
                </div>
              </div>
              
              {/* Sparkle effects on brand crown */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Sparkles className="w-24 h-24 text-yellow-300 opacity-60 animate-ping" />
              </motion.div>
            </motion.div>
          )}

        </div>

        {/* Master details content block & system alignment info */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6 z-30"
            >
              <div className="space-y-2">
                <span className={`px-4 py-1 text-[10px] font-mono font-extrabold uppercase tracking-widest bg-gradient-to-r ${accentColor} text-slate-950 rounded-full shadow-lg`}>
                  {plan.toUpperCase()} KING TIER UNLOCKED
                </span>
                <h2 className="text-3xl font-sans font-black text-slate-100 tracking-tight leading-none pt-2.5">
                  ARES System Refactored Successfully
                </h2>
                <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto leading-relaxed">
                  The complete high-priority core processor schema is active. Dynamic key integrations, structural limits, and developer nodes have updated successfully with lifetime premium configurations.
                </p>
              </div>

              {/* Dynamic Feature list showing unlimited state and limited calendar times */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-left space-y-3 max-w-md mx-auto">
                <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-bounce" /> Verified Benefits & Expiry Checklist:
                </p>
                <div className="grid grid-cols-1 gap-2.5 font-sans text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>King profile emblem</strong> fully unlocked.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Limits: {isTeam ? '60 Days synchronization license' : '30 Days complete creator license'}</strong> is active on your device.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Advanced high-volume execution schemas are unlocked completely.</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`px-10 py-3 rounded-full bg-gradient-to-r ${accentColor} text-slate-950 font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-xl transition-all`}
              >
                Initialize Refactored Workspace
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
