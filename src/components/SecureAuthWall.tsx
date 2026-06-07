import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fingerprint, 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  CheckCircle, 
  Timer, 
  ChevronRight, 
  ArrowRight,
  ShieldAlert,
  Zap,
  Globe,
  Database,
  Eye,
  EyeOff,
  User,
  X
} from 'lucide-react';

interface SecureAuthWallProps {
  onAuthSuccess: () => void;
  onClose?: () => void;
  triggerGlobalNotice: (msg: string) => void;
}

interface AuthStats {
  databaseType: string;
  hashingAlgorithm: string;
  activeSessions: number;
  totalRegisteredUsers: number;
  rateLimitingWindowMs: number;
  maxLoginAttempts: number;
}

export const SecureAuthWall: React.FC<SecureAuthWallProps> = ({ onAuthSuccess, onClose, triggerGlobalNotice }) => {
  const [view, setView] = useState<'welcome' | 'signup' | 'login' | 'forgot' | 'verify'>('welcome');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility states
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Dynamic Password strength criteria
  const evaluatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };
  
  // Sandbox helper triggers
  const [sandboxVerifyToken, setSandboxVerifyToken] = useState<string | null>(null);
  const [sandboxResetToken, setSandboxResetToken] = useState<string | null>(null);
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);

  // Focus rattle animator for clicks outside
  const [rattleKey, setRattleKey] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Fetch security stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/auth/config-summary');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Lockout clock
  useEffect(() => {
    if (lockoutCountdown !== null && lockoutCountdown > 0) {
      const timer = setTimeout(() => {
        setLockoutCountdown(prev => (prev !== null && prev > 1) ? prev - 1 : null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutCountdown]);

  const clearInputs = () => {
    setEmailInput('');
    setNameInput('');
    setPasswordInput('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetTokenInput('');
    setNewPasswordInput('');
  };

  // Clicks on backdrop trigger focus animation
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      setRattleKey(prev => prev + 1);
      triggerGlobalNotice('Access Denied: Authentication required to initialize ARES-9 compiler.');
    }
  };

  // Sign Up Action
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!emailInput || !passwordInput || !nameInput) {
      setErrorMsg('All fields are requested.');
      return;
    }

    const strength = evaluatePasswordStrength(passwordInput);
    if (strength < 75) {
      setErrorMsg('Account creation denied. Please establish a strong password meeting at least 3 of our requirements (length 8+, capitals, numbers, symbols).');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput, name: nameInput })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Identity registration rejected.');
      } else {
        setSuccessMsg(data.message);
        if (data.devSandboxVerificationToken) {
          setSandboxVerifyToken(data.devSandboxVerificationToken);
        }
        triggerGlobalNotice('User identity compiled successfully!');
        fetchStats();
        setTimeout(() => {
          setView('verify');
        }, 1000);
      }
    } catch (err) {
      setErrorMsg('Handshake loss with authentication database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Action
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!emailInput || !passwordInput) {
      setErrorMsg('Email and credentials must be provided.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Signature check failed.');
        if (data.lockoutSeconds) {
          setLockoutCountdown(data.lockoutSeconds);
        }
      } else {
        localStorage.setItem('ares_auth_token', data.token);
        triggerGlobalNotice('Access Granted. Sandbox credentials synchronized!');
        window.dispatchEvent(new Event('ares-auth-changed'));
        onAuthSuccess();
      }
    } catch (err) {
      setErrorMsg('Authentication cluster timed out.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email Verification Action
  const handleVerifyEmail = async (tokenStr: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr })
      });
      const data = await res.json();

      if (!res.ok) {
         setErrorMsg(data.error || 'Token expired or index unrecognized.');
       } else {
         setSuccessMsg(data.message);
         setSandboxVerifyToken(null);
         triggerGlobalNotice('Active mail verification confirmed! Auto-login activated.');
         if (data.token) {
           localStorage.setItem('ares_auth_token', data.token);
           window.dispatchEvent(new Event('ares-auth-changed'));
         }
         setTimeout(() => {
           onAuthSuccess();
           clearInputs();
         }, 1200);
       }
    } catch (err) {
      setErrorMsg('Database response timeout.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request password reset token
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!emailInput) {
      setErrorMsg('Please supply check email address.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      setSuccessMsg(data.message);
      if (data.mockToken) {
        setSandboxResetToken(data.mockToken);
        setResetTokenInput(data.mockToken);
      }
      triggerGlobalNotice('Handshake dispatched recovery token.');
    } catch (err) {
      setErrorMsg('Failed launching email sequence.');
    } finally {
      setIsLoading(false);
    }
  };

  // Accept Reset Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!resetTokenInput || !newPasswordInput) {
      setErrorMsg('Both reset token and new password are required.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenInput, newPassword: newPasswordInput })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Validation mismatch on authentication token.');
      } else {
        setSuccessMsg(data.message);
        setSandboxResetToken(null);
        triggerGlobalNotice('High-rounds bcrypt database update verified!');
        setTimeout(() => {
          setView('login');
          clearInputs();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg('Hardware record lock failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto cursor-pointer"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] select-none pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80')" }} />
      
      {/* Decorative Matrix grid nodes */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      {/* Main Glassmorphic Auth Portal Card */}
      <motion.div
        key={rattleKey}
        ref={cardRef}
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 220 }}
        // Subtle shake on custom rattle key update
        whileTap={{ scale: 0.99 }}
        className="relative bg-white w-full max-w-lg rounded-[32px] border border-slate-200/90 shadow-2xl overflow-hidden cursor-default flex flex-col bg-gradient-to-b from-white to-slate-50/70"
        onClick={(e) => e.stopPropagation()} // halt bubbling
      >
        
        {/* Hologram aesthetic upper rail */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 w-full" />

        {/* Brand Banner */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-indigo-950/20">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h2 className="font-mono font-bold tracking-wider text-xs text-indigo-400 uppercase">
                ARES-9 SECURITY VERIFICATION
              </h2>
              <span className="text-sm font-sans font-black text-slate-100 flex items-center gap-1.5">
                Core Workspace Access
                <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="text-right font-mono text-[9px] text-slate-400 hidden sm:block leading-tight">
                <div>DB: JSON_ENCRYPTED</div>
                <div>HASH: BCryptJS (10-Rnd)</div>
              </div>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors sm:ml-2 shrink-0"
                title="Cancel & Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Validation Notice banners inside */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-2xl border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 text-rose-800 text-xs font-semibold rounded-2xl border border-rose-250 border-rose-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {lockoutCountdown !== null && (
            <div className="p-3.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-2.5 animate-pulse">
              <Timer className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Bruteforce lockout active. Please wait {lockoutCountdown}s before retry.</span>
            </div>
          )}

          {/* VIEW: Welcome Gate */}
          {view === 'welcome' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h3 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight">
                  Unlock System Compilation
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed max-w-md mx-auto">
                  ARES-9 is compiled explicitly with zero-trust credentials. To view, edit, simulate, and load complex system architectures, you must first register or connect a secure profile.
                </p>
              </div>

              {/* Quick stats box */}
              {stats && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center font-mono text-[10px]">
                  <div className="space-y-0.5 border-r border-slate-200/60">
                    <span className="text-slate-400 uppercase font-black tracking-wider block">ALGORITHM</span>
                    <strong className="text-slate-800 text-xs block font-bold">{stats.hashingAlgorithm.split(' ')[0]}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase font-black tracking-wider block">LOCKOUT LIMIT</span>
                    <strong className="text-slate-800 text-xs block font-bold">{stats.maxLoginAttempts} Failed Attempts</strong>
                  </div>
                </div>
              )}

              {/* Action grid */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setView('signup'); clearInputs(); }}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
                >
                  <span>Create Secure Profile (Sign Up)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => { setView('login'); clearInputs(); }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold uppercase py-3.5 rounded-2xl flex items-center justify-center cursor-pointer border border-slate-200/80 transition-all hover:scale-[1.01]"
                >
                  <span>Authorize Existing Session (Sign In)</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 font-mono text-xs font-semibold uppercase py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <span>Cancel & Use Guest Mode (Bypass) ✕</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SIGN UP */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">E-mail Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="architect@domain.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Create Strong Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showSignUpPass ? 'text' : 'password'}
                    placeholder="Create a strong, secure password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPass(!showSignUpPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none p-1.5 rounded-full transition-colors cursor-pointer hover:bg-slate-100"
                    title={showSignUpPass ? "Hide Password" : "Show Password"}
                  >
                    {showSignUpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordInput.length > 0 && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-150 border-slate-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 uppercase font-black tracking-wider">STRENGTH SCORE:</span>
                      <span className={`font-black uppercase ${
                        evaluatePasswordStrength(passwordInput) === 0 ? 'text-rose-500 animate-pulse' :
                        evaluatePasswordStrength(passwordInput) <= 50 ? 'text-amber-500' :
                        evaluatePasswordStrength(passwordInput) <= 75 ? 'text-indigo-500' :
                        'text-emerald-500'
                      }`}>
                        {evaluatePasswordStrength(passwordInput) === 0 ? 'Critically Weak (0%)' :
                         evaluatePasswordStrength(passwordInput) <= 50 ? 'Moderate (50%)' :
                         evaluatePasswordStrength(passwordInput) <= 75 ? 'Strong (75%)' :
                         'Extremely Secure (100%)'}
                      </span>
                    </div>

                    {/* Progress bar represent */}
                    <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          evaluatePasswordStrength(passwordInput) <= 25 ? 'bg-rose-500' :
                          evaluatePasswordStrength(passwordInput) <= 50 ? 'bg-amber-500' :
                          evaluatePasswordStrength(passwordInput) <= 75 ? 'bg-indigo-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${evaluatePasswordStrength(passwordInput)}%` }}
                      />
                    </div>

                    {/* Checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 font-sans text-[10.5px] pt-1 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordInput.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={passwordInput.length >= 8 ? 'text-slate-800 font-semibold' : 'text-slate-400'}>8+ Characters Required</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordInput) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={/[A-Z]/.test(passwordInput) ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Uppercase Letter (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(passwordInput) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={/[0-9]/.test(passwordInput) ? 'text-slate-800 font-semibold' : 'text-slate-400'}>At least 1 Number (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(passwordInput) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={/[^A-Za-z0-9]/.test(passwordInput) ? 'text-slate-800 font-semibold' : 'text-slate-400'}>Special Symbol (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Compliance box */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200/40 leading-relaxed space-y-1">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-650 text-indigo-600 shrink-0" /> Zero-Trust Encryption Standards
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Passwords undergo 10 iterations of bcrypt salting dynamically before disk commits. No raw data is serialized inside telemetry streams.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-950 hover:bg-slate-850 text-white font-mono text-xs font-bold uppercase py-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-center shadow-lg"
              >
                {isLoading ? 'Salting Credential File...' : 'Register Secure Profile'}
              </button>

              <div className="flex items-center justify-between text-xs font-sans pt-2">
                <button
                  type="button"
                  onClick={() => { setView('welcome'); clearInputs(); }}
                  className="text-slate-500 hover:text-slate-900 font-medium"
                >
                  ← Welcome Screen
                </button>
                <button
                  type="button"
                  onClick={() => { setView('login'); clearInputs(); }}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  Use existing login
                </button>
              </div>
            </form>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">User Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="registered-user@dev.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">User Password</label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); clearInputs(); }}
                    className="text-[10px] text-indigo-600 font-mono hover:underline font-bold"
                  >
                    Forgot Key?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showSignInPass ? 'text' : 'password'}
                    placeholder="Secured password entry"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPass(!showSignInPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none p-1.5 rounded-full transition-colors cursor-pointer hover:bg-slate-100"
                    title={showSignInPass ? "Hide Password" : "Show Password"}
                  >
                    {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || lockoutCountdown !== null}
                className="w-full bg-slate-950 hover:bg-slate-850 text-white font-mono text-xs font-bold uppercase py-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Verifying Hashes...' : 'Authorize Client Session'}
              </button>

              <div className="flex items-center justify-between text-xs font-sans pt-2">
                <button
                  type="button"
                  onClick={() => { setView('welcome'); clearInputs(); }}
                  className="text-slate-500 hover:text-slate-900 font-medium"
                >
                  ← Welcome Screen
                </button>
                <div>
                  <span className="text-slate-400">Need profile? </span>
                  <button
                    type="button"
                    onClick={() => { setView('signup'); clearInputs(); }}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Sign up now
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-4">
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e-mail used for registration"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-950 hover:bg-slate-850 text-white font-mono text-xs font-bold uppercase py-3 rounded-2xl transition-all cursor-pointer"
                >
                  {isLoading ? 'Dispatching...' : 'Initiate Password Reset'}
                </button>
              </form>

              {/* Dev Simulation intercept */}
              {sandboxResetToken && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-250 border-amber-200 space-y-2 text-xs font-mono text-amber-900">
                  <div className="flex items-center gap-1 bg-amber-200/50 p-1 rounded px-2.5 self-start font-bold uppercase text-[9px] w-max">
                    <Timer className="w-3.5 h-3.5 text-amber-600" /> Dev Sandbox intercept
                  </div>
                  <p className="font-sans text-[11px] text-amber-800 leading-normal">
                    This sandbox simulated mail arrival and captured the reset token:
                  </p>
                  <code className="block bg-white p-2 rounded text-slate-800 text-center select-all font-bold border border-amber-200">
                    {sandboxResetToken}
                  </code>
                </div>
              )}

              {/* Reset form */}
              <form onSubmit={handleResetPassword} className="space-y-3 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Insert Reset Token Code</label>
                  <input
                    type="text"
                    placeholder="Paste sandbox caught hexagonal code"
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">New Password (Min 6 characters)</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Enter new account key"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none p-1.5 rounded-full transition-colors cursor-pointer hover:bg-slate-100"
                      title={showNewPass ? "Hide Password" : "Show Password"}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase py-3.5 rounded-2xl transition-all cursor-pointer"
                >
                  Overwrite Credentials Hashing
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); clearInputs(); }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-sans"
                >
                  ← Back to Session Authorization
                </button>
              </div>
            </div>
          )}

          {/* VIEW: EMAIL VERIFICATION GATE */}
          {view === 'verify' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-sans leading-relaxed text-center">
                A verification token was dispatched to complete zero-trust verification. Please finish this to active the developer sandbox index.
              </p>

              {sandboxVerifyToken ? (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 font-mono text-xs text-indigo-950">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-150/80 bg-indigo-200/50 w-max font-bold uppercase text-[9px] text-indigo-800">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Dev Simulation Mail Box
                  </div>
                  <p className="font-sans text-[11px] text-slate-600 leading-normal">
                    This developer sandbox environment intercepted your validation token safely. Tap below to verify instantly without leaving this tab:
                  </p>
                  
                  <button
                    onClick={() => handleVerifyEmail(sandboxVerifyToken)}
                    className="w-full bg-slate-900 hover:bg-slate-800 border-t border-slate-800 py-3 rounded-xl cursor-pointer text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Verify Registration Instantly
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Manual Validation Token</label>
                    <input
                      type="text"
                      placeholder="Insert 48-char signature key"
                      value={resetTokenInput}
                      onChange={(e) => setResetTokenInput(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                    />
                  </div>
                  <button
                    onClick={() => handleVerifyEmail(resetTokenInput)}
                    disabled={isLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold uppercase py-3 rounded-2xl transition-all cursor-pointer border border-slate-200"
                  >
                    Check Signature Key
                  </button>
                </div>
              )}

              <div className="text-center pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setView('signup'); clearInputs(); }}
                  className="text-xs text-slate-500 hover:text-slate-900 font-sans"
                >
                  ← Refine Email
                </button>
                <button
                  type="button"
                  onClick={() => { setView('login'); clearInputs(); }}
                  className="text-xs text-indigo-650 text-indigo-600 hover:underline font-bold"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Outer security credentials footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 border-slate-200/60 font-mono text-[9.5px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 uppercase font-bold text-emerald-600">
            <Globe className="w-3.5 h-3.5 text-emerald-500 animate-spin" /> Web Host Config Guard
          </span>
          <span className="flex items-center gap-1 font-bold">
            <Database className="w-3 h-3 text-slate-500" /> ISO 27001 SECURE
          </span>
        </div>

      </motion.div>
    </div>
  );
};
