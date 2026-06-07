import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  LogOut, 
  KeyRound, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle,
  X,
  BadgePercent,
  Timer,
  Zap,
  Fingerprint,
  Copy,
  ExternalLink,
  CreditCard,
  Crown,
  Clock,
  ShieldAlert,
  Wallet
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  createdAt: string;
  plan?: 'free' | 'pro' | 'team';
  planExpiresAt?: string;
}

interface AuthConfigStats {
  databaseType: string;
  hashingAlgorithm: string;
  activeSessions: number;
  totalRegisteredUsers: number;
  rateLimitingWindowMs: number;
  maxLoginAttempts: number;
  httpsEnforced: boolean;
}

export const UserAccountAuth: React.FC<{ triggerGlobalNotice: (msg: string) => void }> = ({ triggerGlobalNotice }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ares_auth_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Auth statistics summary fetched from secure backend
  const [stats, setStats] = useState<AuthConfigStats | null>(null);

  const getRemainingTimeText = (expiresAt?: string) => {
    if (!expiresAt) return '';
    const expiry = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    if (diff <= 0) {
      return 'Expired';
    }
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
      return `${mins}m left`;
    }
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) {
      return `${hours} hours left`;
    }
    const days = Math.floor(diff / 86400000);
    return `${days} days left`;
  };

  // Dialog & drop-down triggers
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'plans' | 'history' | null>(null);
  
  // Purchase history specific states
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [myPaymentsLoading, setMyPaymentsLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  
  // Input fields
  const [emailInput, setEmailInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification sandbox helper states (for easily simulating receiving email verification tokens/reset codes)
  const [sandboxVerifyToken, setSandboxVerifyToken] = useState<string | null>(null);
  const [sandboxResetToken, setSandboxResetToken] = useState<string | null>(null);
  const [resetTokenInput, setResetTokenInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Lockout countdown timer
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);

  // FamPay Checkout & Admin Persistence State variables
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'team' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'manual'>('qr');
  const [senderName, setSenderName] = useState<string>('');
  const [senderUpiId, setSenderUpiId] = useState<string>('');
  const [manualStep, setManualStep] = useState<'form' | 'details'>('form');
  const [payorUtr, setPayorUtr] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);

  const isProActive = !!(user && user.plan === 'pro' && user.planExpiresAt && (new Date(user.planExpiresAt).getTime() > Date.now()));
  const isTeamActive = !!(user && user.plan === 'team' && user.planExpiresAt && (new Date(user.planExpiresAt).getTime() > Date.now()));

  // 1. Fetch current profile from backend
  const fetchProfile = async (currentToken: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        window.dispatchEvent(new CustomEvent('ares-user-plan-updated', { detail: { plan: data.user?.plan || 'free' } }));
      } else {
        // Token stale, purge client
        setToken(null);
        setUser(null);
        localStorage.removeItem('ares_auth_token');
      }
    } catch (err) {
      console.error('[AuthError] Failed fetching profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = async (targetPlan: 'free' | 'pro' | 'team') => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/auth/update-plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: targetPlan })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSuccessMsg(`Plan updated successfully to ${targetPlan.toUpperCase()}! Entitlements unlocked immediately.`);
        triggerGlobalNotice(`Subscribed to the ${targetPlan.toUpperCase()} plan.`);
        window.dispatchEvent(new CustomEvent('ares-user-plan-updated', { detail: { plan: targetPlan, planExpiresAt: data.user?.planExpiresAt } }));
        if (targetPlan === 'pro' || targetPlan === 'team') {
          window.dispatchEvent(new CustomEvent('ares-trigger-unlock-animation', { detail: { plan: targetPlan } }));
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Upgrade failed.');
      }
    } catch (err) {
      setErrorMsg('Network error while updating subscription plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('You must be logged in to confirm a payment.');
      return;
    }
    if (!payorUtr || payorUtr.trim().length === 0) {
      setErrorMsg('Please enter the 12-digit UPI reference number (UTR).');
      return;
    }
    if (!senderName || senderName.trim().length === 0) {
      setErrorMsg('Please enter the Name associated with your payment.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const targetAmount = checkoutPlan === 'pro' ? 99 : 199;

      const res = await fetch('/api/auth/submit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: checkoutPlan,
          utr: payorUtr,
          senderName: senderName,
          amountInINR: targetAmount
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user); // sets new plan in UI
        
        // Formulate WhatsApp message and URL
        const planLabel = checkoutPlan === 'pro' ? 'Pro Plan Upgrade' : 'Team Collaboration Plan';
        const msgText = `Hi Aditya! I have submitted a payment of ₹${targetAmount} for the ${planLabel}.\n\n--- Proof Details ---\n- Sender Name: ${senderName}\n- My Email: ${user?.email || 'N/A'}\n- Transaction UTR: ${payorUtr}\n\nPlease verify and approve the premium plan! Thank you.`;
        const waUrl = `https://wa.me/917980259343?text=${encodeURIComponent(msgText)}`;

        setPaymentSuccessData({
          plan: checkoutPlan,
          utr: payorUtr,
          senderName,
          amount: targetAmount,
          whatsappUrl: waUrl
        });

        setSuccessMsg(`Payment registered! Subscription upgraded to ${checkoutPlan.toUpperCase()}! Aditya Sharma has been notified on WhatsApp (+91 7980259343) and Email.`);
        triggerGlobalNotice(`Upgraded successfully to ${checkoutPlan.toUpperCase()}!`);
        window.dispatchEvent(new CustomEvent('ares-user-plan-updated', { detail: { plan: checkoutPlan, planExpiresAt: data.user?.planExpiresAt } }));
        window.dispatchEvent(new CustomEvent('ares-trigger-unlock-animation', { detail: { plan: checkoutPlan } }));

        // Automatically send details by launching the configured WhatsApp url safely
        try {
          const a = document.createElement('a');
          a.href = waUrl;
          a.target = '_blank';
          a.rel = 'noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (openErr) {
          console.error('Failed to trigger automatic WhatsApp redirect', openErr);
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Upgrade payment verification failed.');
      }
    } catch (err) {
      setErrorMsg('Network error while registering payment transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminPayments = async () => {
    try {
      setAdminLoading(true);
      const res = await fetch('/api/auth/admin-payments');
      if (res.ok) {
        const data = await res.json();
        setAllPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Failed fetching admin receipts:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminApprove = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      setAdminLoading(true);
      const res = await fetch('/api/auth/admin-approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId, action })
      });
      if (res.ok) {
        triggerGlobalNotice(`Transaction successfully ${action}d!`);
        fetchAdminPayments();
        if (token) {
          fetchProfile(token);
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to complete admin verification update.');
      }
    } catch (err) {
      setErrorMsg('Network error updating admin verification.');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOpen) {
      fetchAdminPayments();
    }
  }, [isAdminOpen]);

  const fetchMyPurchaseHistory = async () => {
    if (!token) return;
    try {
      setMyPaymentsLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/auth/my-payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyPayments(data.payments || []);
      } else {
        setErrorMsg('Failed to process purchase history query.');
      }
    } catch (err) {
      console.error('Error fetching purchase history', err);
      setErrorMsg('Network error querying purchase receipts.');
    } finally {
      setMyPaymentsLoading(false);
    }
  };

  const handleExportMyPurchaseHistory = async () => {
    if (!token) {
      setErrorMsg('You must be logged in to export purchase history.');
      return;
    }
    try {
      setExportLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/auth/export-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message);
        triggerGlobalNotice('Purchase history successfully exported to adikumarsharma06@gmail.com & adyukumarsharma123456@gmail.com!');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to dispatch purchase history report.');
      }
    } catch (err) {
      console.error('Error exporting purchase history', err);
      setErrorMsg('Network error exporting purchase report.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    if (authModalView === 'history') {
      fetchMyPurchaseHistory();
    }
  }, [authModalView]);

  // 2. Fetch security configs/stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/auth/config-summary');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('[StatsError] Failed fetching auth configurations', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setUser(null);
    }
    fetchStats();
  }, [token]);

  // Lockout countdown loop
  useEffect(() => {
    if (lockoutCountdown !== null && lockoutCountdown > 0) {
      const timer = setTimeout(() => {
        setLockoutCountdown(prev => (prev !== null && prev > 1) ? prev - 1 : null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutCountdown]);

  useEffect(() => {
    const handleOpenDrawer = () => {
      setAuthModalView('plans');
      setErrorMsg(null);
      setSuccessMsg(null);
    };
    window.addEventListener('ares-open-plans-drawer', handleOpenDrawer);
    return () => {
      window.removeEventListener('ares-open-plans-drawer', handleOpenDrawer);
    };
  }, []);

  // Action: Clean Messages
  const clearInputs = () => {
    setEmailInput('');
    setNameInput('');
    setPasswordInput('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetTokenInput('');
    setNewPasswordInput('');
  };

  // Action: Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!emailInput || !passwordInput || !nameInput) {
      setErrorMsg('All fields are required.');
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
        setErrorMsg(data.error || 'Registration failed.');
      } else {
        setSuccessMsg(data.message);
        // Feed mock email verification token directly to sandbox for testing!
        if (data.devSandboxVerificationToken) {
          setSandboxVerifyToken(data.devSandboxVerificationToken);
        }
        triggerGlobalNotice('Sign up successful! Security key hashing verified.');
        fetchStats();
        // Shift context to direct instruction
        setTimeout(() => {
          setAuthModalView('verify');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg('Local server connection lost during operation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!emailInput || !passwordInput) {
      setErrorMsg('Credentials cannot be empty.');
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
        setErrorMsg(data.error || 'Authentication error.');
        if (data.lockoutSeconds) {
          setLockoutCountdown(data.lockoutSeconds);
        }
      } else {
        localStorage.setItem('ares_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        triggerGlobalNotice('Session active. Security rate limits synchronized.');
        window.dispatchEvent(new Event('ares-auth-changed'));
        setAuthModalView(null);
        setIsDropdownOpen(false);
        clearInputs();
      }
    } catch (err) {
      setErrorMsg('Failed connection to authentication cluster.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!emailInput) {
      setErrorMsg('Please specify your account email.');
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
      triggerGlobalNotice('Password reset handshake established.');
    } catch (err) {
      setErrorMsg('Could not dispatch password recovery request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Reset Password Confirm
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!resetTokenInput || !newPasswordInput) {
      setErrorMsg('Token validation key and new password are required.');
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
        setErrorMsg(data.error || 'Could not verify reset token.');
      } else {
        setSuccessMsg(data.message);
        triggerGlobalNotice('Credentials restructured safely with high rounds bcrypt hashes.');
        setSandboxResetToken(null);
        setTimeout(() => {
          setAuthModalView('login');
          clearInputs();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg('Failed updating credentials database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Verify Email Confirm
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
        setErrorMsg(data.error || 'Activation token expired or invalid.');
      } else {
        setSuccessMsg(data.message);
        setSandboxVerifyToken(null);
        triggerGlobalNotice('Email verified! Auto-login activated.');
        
        if (data.token) {
          localStorage.setItem('ares_auth_token', data.token);
          setToken(data.token);
          fetchProfile(data.token);
          window.dispatchEvent(new Event('ares-auth-changed'));
        } else if (token) {
          fetchProfile(token);
        }
        setTimeout(() => {
          setAuthModalView(null);
          clearInputs();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg('Verification lookup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Delete Profile
  const handleDeleteAccount = async () => {
    if (!token) return;
    const confirmText = prompt("Type 'CONFIRM DELETE' to wipe all credentials and session telemetry.");
    if (confirmText !== 'CONFIRM DELETE') {
      triggerGlobalNotice('Wipe sequence aborted.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.removeItem('ares_auth_token');
        localStorage.removeItem('ares_auth_bypass');
        setToken(null);
        setUser(null);
        setIsDropdownOpen(false);
        triggerGlobalNotice('All records destroyed securely.');
        window.dispatchEvent(new Event('ares-auth-changed'));
        fetchStats();
      } else {
        triggerGlobalNotice('Access revocation failed during deletion.');
      }
    } catch (err) {
      triggerGlobalNotice('Operation timed out.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Log Out
  const handleLogActiveSession = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (err) {}
    localStorage.removeItem('ares_auth_token');
    localStorage.removeItem('ares_auth_bypass');
    setToken(null);
    setUser(null);
    setIsDropdownOpen(false);
    triggerGlobalNotice('Session logged out and local hashes cleared.');
    window.dispatchEvent(new Event('ares-auth-changed'));
    fetchStats();
  };

  const currentThemeTag = user ? "bg-emerald-600/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-200 text-slate-800";

  return (
    <div className="relative inline-block text-left z-50">
      
      {/* Account trigger badge */}
      <div className="flex items-center gap-2">
        {stats && (
          <div className="hidden lg:flex flex-col items-end text-right font-mono text-[9px] text-slate-400 select-none">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
              {stats.hashingAlgorithm.split(' ')[0]} Active
            </span>
            <span>Auth Nodes: {stats.totalRegisteredUsers}</span>
          </div>
        )}

        <button
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            fetchStats();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold shadow-sm transition-all cursor-pointer ${
            user 
              ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {user ? (
            <>
              <div className="relative shrink-0 select-none">
                <div className={`w-5 h-5 rounded-full text-[9px] font-sans font-black flex items-center justify-center text-white ring-1 shrink-0 ${
                  user.plan === 'team' 
                    ? 'bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 ring-amber-300 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)] font-bold' 
                    : user.plan === 'pro'
                      ? 'bg-gradient-to-tr from-indigo-600 via-violet-500 to-purple-400 ring-indigo-300 shadow-[0_0_6px_rgba(99,102,241,0.5)] font-bold'
                      : 'bg-indigo-600 ring-indigo-450'
                }`}>
                  {(user.plan === 'pro' || user.plan === 'team') ? (
                    <Crown className="w-3.5 h-3.5 text-white font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                  ) : (
                    (user.name || user.email.split('@')[0]).trim().charAt(0).toUpperCase()
                  )}
                </div>
                {(user.plan === 'pro' || user.plan === 'team') && (
                  <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[6px] text-slate-950 rounded-full p-0.5 border border-amber-600 shadow-sm font-black leading-none flex items-center justify-center">
                    👑
                  </div>
                )}
              </div>
              <span className="max-w-[120px] truncate text-[11px] font-sans font-semibold flex items-center gap-1">
                {user.name || user.email.split('@')[0]}
                {(user.plan === 'pro' || user.plan === 'team') && <span className="text-[9px] text-yellow-400 font-bold font-sans uppercase">King</span>}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4 text-slate-500" />
              <span>User Sign In</span>
            </>
          )}
        </button>
      </div>

      {/* Account Settings Dropdown portal */}
      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop click barrier */}
            <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden text-left"
            >
              {/* Dropdown Header */}
              <div className="p-4 bg-slate-950 text-white space-y-1 bg-gradient-to-br from-slate-950 to-indigo-950">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-black">
                    ARES IDENTITY HUB
                  </span>
                  {user && (
                    <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {user.emailVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="pt-2 space-y-0.5">
                    <p className="text-sm font-sans font-extrabold truncate text-slate-100">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs font-sans text-slate-300 truncate">{user.email}</p>
                    <p className="text-[9px] font-mono text-slate-400 truncate">UUID: {user.id}</p>
                    
                    {user.planExpiresAt && (user.plan === 'pro' || user.plan === 'team') && (
                      <div className="mt-2.5 p-2 bg-yellow-400/15 rounded-xl border border-yellow-400/25 text-[10px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-yellow-300 font-sans text-[8.5px] uppercase tracking-wide">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />
                            👑 Premium {user.plan.toUpperCase()} Access
                          </span>
                          <span>{getRemainingTimeText(user.planExpiresAt)}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div className="bg-yellow-400 h-full rounded-full animate-pulse" style={{ width: '80%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 space-y-1">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Secure password hashing and connection credentials active. Keep multi-agent actions synchronized.
                    </p>
                  </div>
                )}
              </div>

              {/* Security Metrics Summary inside the dropdown */}
              {stats && (
                <div className="bg-slate-50 border-b border-slate-100 p-3 text-[10px] font-mono text-slate-500 space-y-1 flex flex-col">
                  <div className="flex justify-between">
                    <span>Password Hash:</span>
                    <strong className="text-slate-800">{stats.hashingAlgorithm}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Brute-force Limiter:</span>
                    <strong className="text-slate-800">{stats.maxLoginAttempts} attempts lockout</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>HTTP Secure SSL:</span>
                    <strong className="text-emerald-600 flex items-center gap-0.5 font-bold uppercase">
                      <ShieldCheck className="w-3 h-3" /> Enforced
                    </strong>
                  </div>
                </div>
              )}

              {/* Dynamic Actions List */}
              <div className="p-2 space-y-1">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setAuthModalView('plans');
                        setIsDropdownOpen(false);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <div className="flex-1">
                        <span className="flex items-center justify-between font-sans">
                          Subscription Plans
                          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-indigo-600 text-white rounded font-mono uppercase tracking-tight">
                            {user.plan ? user.plan.toUpperCase() : 'FREE'}
                          </span>
                        </span>
                        <span className="block text-[9px] text-indigo-500 font-normal mt-0.5">Manage premium plan benefits & tools</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setAuthModalView('history');
                        setIsDropdownOpen(false);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <div className="flex-1">
                        <span className="flex items-center justify-between font-sans">
                          Purchase History
                        </span>
                        <span className="block text-[9px] text-slate-500 font-normal mt-0.5">View invoices & export reports</span>
                      </div>
                    </button>

                    {!user.emailVerified && (
                      <button
                        onClick={() => {
                          setAuthModalView('verify');
                          setIsDropdownOpen(false);
                          setErrorMsg(null);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-50 text-amber-800 text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <span>Verify Email Address</span>
                          <span className="block text-[9px] text-amber-600 font-normal mt-0.5">Required for zero-trust authorization</span>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setAuthModalView('forgot');
                        setIsDropdownOpen(false);
                        clearInputs();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      Restore / Update Password
                    </button>

                    <button
                      onClick={handleDeleteAccount}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      Wipe Account Record
                    </button>

                    <button
                      onClick={handleLogActiveSession}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-900 text-xs font-bold border-t border-slate-100 mt-1 pt-2 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-slate-500" />
                      Disconnect Session
                    </button>
                  </>
                ) : (
                  <div className="p-2 space-y-2">
                    <button
                      onClick={() => {
                        setAuthModalView('login');
                        setIsDropdownOpen(false);
                        clearInputs();
                      }}
                      className="w-full bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase py-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                    >
                      Log In Registered User
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalView('signup');
                        setIsDropdownOpen(false);
                        clearInputs();
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold uppercase py-2.5 rounded-xl flex items-center justify-center cursor-pointer transition-all border border-slate-200"
                    >
                      Register Secure Profile
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FULL AUTH & SECURITY MODALS */}
      <AnimatePresence>
        {authModalView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop shadow overlay with fade-in effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setAuthModalView(null)}
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative bg-white w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-20 flex flex-col bg-gradient-to-b from-white to-slate-50 transition-all duration-300 ${['plans', 'history'].includes(authModalView || '') ? 'max-w-4xl' : 'max-w-md'}`}
            >
              
              {/* Modal Brand Upper Header */}
              <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between border-b border-indigo-950/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <Fingerprint className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-slate-100">
                      {authModalView === 'login' && 'ARES-9 Log In'}
                      {authModalView === 'signup' && 'ARES-9 Registration'}
                      {authModalView === 'forgot' && 'Account Recovery'}
                      {authModalView === 'verify' && 'Email Verification Gate'}
                      {authModalView === 'plans' && 'ARES-9 Subscription Tiers'}
                      {authModalView === 'history' && 'ARES-9 Purchase History'}
                    </h3>
                    <span className="text-[9px] font-mono text-slate-400 block tracking-widest uppercase">
                      {['plans', 'history'].includes(authModalView || '') ? 'unlocked entitlements & receipts' : 'SECURE CREDENTIAL VALIDATION'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setAuthModalView(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="p-6 md:p-8 space-y-5">
                
                {/* Global Success / Critical Alerts banner inside Modal */}
                {successMsg && (
                  <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                )}

                {lockoutCountdown !== null && (
                  <div className="p-3.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-2.5 animate-pulse">
                    <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Rate-limit Lockout Active. Please wait {lockoutCountdown}s before retry.</span>
                  </div>
                )}

                {/* VIEW LISTINGS */}
                {authModalView === 'login' && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">User Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="name@company.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">User Password</label>
                        <button
                          type="button"
                          onClick={() => setAuthModalView('forgot')}
                          className="text-[10px] text-indigo-600 font-mono hover:underline font-bold"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          placeholder="Min 6 characters hashed securely"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || lockoutCountdown !== null}
                      className="w-full bg-slate-950 hover:bg-slate-850 text-white font-mono font-bold uppercase text-xs py-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md hover:shadow-indigo-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Verifying Hashes...' : 'Authorize Client Session'}
                    </button>

                    <p className="text-[11px] text-center text-slate-500 pt-2 font-sans">
                      Don't have an architecture account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthModalView('signup'); clearInputs(); }}
                        className="text-indigo-650 text-indigo-600 hover:underline font-bold"
                      >
                        Sign Up Now
                      </button>
                    </p>
                  </form>
                )}

                {authModalView === 'signup' && (
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">E-mail Register</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="design-leader@dev.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Password (Hashed via Bcrypt)</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          placeholder="Min 6 characters required"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-150/40 border-indigo-200/40 text-[10.5px] text-indigo-900 leading-normal font-mono space-y-1">
                      <h5 className="font-semibold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Secure Encryption Standards
                      </h5>
                      <p className="font-sans text-[11px] text-slate-650 text-slate-600">
                        Password undergoes salting and bcrypt hashing on our custom isolated virtual database node. Raw plaintext is never logged, stored, or exposed inside transmission telemetry.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase text-xs py-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      {isLoading ? 'Hashing & Salting...' : 'Create Secure Profile'}
                    </button>

                    <p className="text-[11px] text-center text-slate-500 pt-2 font-sans">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthModalView('login'); clearInputs(); }}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Sign In here
                      </button>
                    </p>
                  </form>
                )}

                {authModalView === 'forgot' && (
                  <div className="space-y-4">
                    {/* Enter Email to generate token */}
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Account Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            placeholder="user@system.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold uppercase text-xs py-3 rounded-2xl transition-all cursor-pointer"
                      >
                        Initiate Reset Sequence
                      </button>
                    </form>

                    {/* Reset Token Received sandbox box */}
                    {sandboxResetToken && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-xs font-mono text-amber-905 text-amber-900">
                        <div className="flex items-center gap-1 bg-amber-200/50 p-1 rounded px-2 self-start font-bold uppercase text-[9px] w-max">
                          <Timer className="w-3 h-3 text-amber-600" /> Dev Simulation Mailbox
                        </div>
                        <p className="font-sans text-[11px] text-amber-800">
                          To make password reset testing simple, the sandbox caught your reset token:
                        </p>
                        <code className="block bg-white p-2 rounded text-slate-800 text-center select-all font-bold border border-amber-200">
                          {sandboxResetToken}
                        </code>
                      </div>
                    )}

                    {/* Enter Token and New Password */}
                    <form onSubmit={handleResetPassword} className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Reset Token Key</label>
                        <input
                          type="text"
                          placeholder="Paste sandbox token here"
                          value={resetTokenInput}
                          onChange={(e) => setResetTokenInput(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">New Password (Min 6 characters)</label>
                        <input
                          type="password"
                          placeholder="Will encode with bcrypt-10 rounds"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          minLength={6}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase text-xs py-3.5 rounded-2xl transition-all cursor-pointer"
                      >
                        Update Account Credentials
                      </button>
                    </form>
                  </div>
                )}

                {authModalView === 'verify' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-550 text-slate-500 font-sans leading-relaxed">
                      Verify your secure account setup. This ensures your workflow exports can only be triggered by the authentic mailbox owner.
                    </p>

                    {/* Sandbox Token Catcher */}
                    {sandboxVerifyToken ? (
                      <div className="p-4 bg-indigo-50 border border-indigo-200/90 rounded-2xl space-y-3 font-mono text-xs text-indigo-950">
                        <div className="flex items-center gap-1.5 bg-indigo-200/50 p-1 px-2.5 rounded-lg w-max font-bold uppercase text-[9px] text-indigo-805 text-indigo-800">
                          <Zap className="w-3.5 h-3.5 text-indigo-600" /> Dev Verification Sandbox
                        </div>
                        <p className="font-sans text-[11px] text-slate-650 text-slate-600 leading-normal">
                          The system generated the following secure link for registration completion. Click below to verify instantly:
                        </p>
                        
                        <button
                          onClick={() => handleVerifyEmail(sandboxVerifyToken)}
                          className="w-full bg-slate-900 hover:bg-slate-850 hover:shadow text-white font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center select-none border border-slate-800"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                          Simulate Verify Email Click Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Manual Verification Key</label>
                          <input
                            type="text"
                            placeholder="Enter 48-char hex code"
                            value={resetTokenInput}
                            onChange={(e) => setResetTokenInput(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-slate-800"
                          />
                        </div>
                        <button
                          onClick={() => handleVerifyEmail(resetTokenInput)}
                          disabled={isLoading}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold uppercase text-xs py-3 rounded-2xl transition-all cursor-pointer"
                        >
                          Verify credentials key
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {authModalView === 'plans' && (
                  <div className="space-y-6">
                    {/* Error & Success Messages within plans view */}
                    {errorMsg && (
                      <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 text-[11px] rounded-xl flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-550" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[11px] rounded-xl flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {/* VIEW 1: ADMIN CONSOLE LOGS TAB */}
                    {isAdminOpen ? (
                      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-400" />
                            <div>
                              <h3 className="text-xs font-mono font-bold uppercase tracking-wider">ARES-9 Secure Payment Audits</h3>
                              <p className="text-[10px] text-slate-400 font-sans">Review Submitted FamPay UPI Transactions & UTR references</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsAdminOpen(false)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono cursor-pointer transition-colors"
                          >
                            ← Close Admin Panel
                          </button>
                        </div>

                        {adminLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                            <span className="text-[10px] font-mono text-slate-500">Querying transactions database...</span>
                          </div>
                        ) : allPayments.length === 0 ? (
                          <div className="py-12 text-center space-y-1">
                            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                            <p className="text-xs text-slate-400 font-sans">No FamPay UPI payments submitted yet.</p>
                            <p className="text-[9.5px] text-slate-650 font-mono">Completed checkouts will register here instantly.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {allPayments.map((pay: any) => (
                              <div 
                                key={pay.id} 
                                className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3 hover:border-slate-800 transition-colors"
                              >
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-indigo-300 font-sans">{pay.senderName}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-slate-400 rounded-full font-mono">
                                        Subscribed: {pay.plan?.toUpperCase()}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{pay.userEmail}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-extrabold text-emerald-400 font-mono font-bold">₹{pay.amountInINR} INR</span>
                                    <p className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                                      {new Date(pay.submittedAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 text-[10px] font-mono">
                                  <div>
                                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Transaction UTR</span>
                                    <span className="text-indigo-200 font-bold tracking-wider select-all">{pay.utr}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Receipt Date</span>
                                    <span className="text-slate-300">{new Date(pay.submittedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-900/50">
                                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                                    <span className="text-slate-500">Status:</span>
                                    {pay.status === 'pending' && <span className="text-amber-500 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/40 font-bold uppercase">Pending Verification</span>}
                                    {pay.status === 'approved' && <span className="text-emerald-500 bg-emerald-950/25 px-1.5 py-0.5 rounded border border-emerald-900/40 font-bold uppercase">Verified & Active</span>}
                                    {pay.status === 'rejected' && <span className="text-rose-500 bg-rose-950/25 px-1.5 py-0.5 rounded border border-rose-900/40 font-bold uppercase">Rejected</span>}
                                  </div>

                                  {pay.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAdminApprove(pay.id, 'approve')}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[9.5px] font-mono font-bold uppercase cursor-pointer transition-all"
                                      >
                                        Approve Sub
                                      </button>
                                      <button
                                        onClick={() => handleAdminApprove(pay.id, 'reject')}
                                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2.5 py-1 rounded text-[9.5px] font-mono font-bold uppercase cursor-pointer transition-all"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : paymentSuccessData ? (
                      /* VIEW 2: CHECKOUT SUCCESS & WHATSAPP REDIRECT PANEL */
                      <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 space-y-6 text-center max-w-xl mx-auto animate-fade-in">
                        <div className="w-12 h-12 bg-emerald-950 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                          <CheckCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-400">
                            FamPay Subscription Verified
                          </h3>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            Your transaction has been submitted to the database and your plan has been updated to{' '}
                            <strong className="text-indigo-400">{paymentSuccessData.plan.toUpperCase()}</strong>!
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            UTR Ref Code: {paymentSuccessData.utr} • Value Paid: ₹{paymentSuccessData.amount} INR
                          </p>
                        </div>

                        {/* Automated Log Details */}
                        <div className="text-left font-mono text-[9px] bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-1.5 text-slate-400">
                          <div className="flex items-center gap-1.5 text-[8px] tracking-wider text-slate-500 uppercase font-bold mb-1 border-b border-slate-800 pb-1">
                            📟 Notification Gateway Diagnostics
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-500">📧 Target Emails:</span>
                            <span className="text-slate-300 font-bold block">adikumarsharma06@gmail.com</span>
                            <span className="text-slate-300 font-bold block">adyukumarsharma123456@gmail.com</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800/40">
                            <span>💬 WhatsApp Target:</span>
                            <span className="text-slate-300">+91 7980259343 (Aditya Sharma)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>📡 Server Gateway:</span>
                            <span className="text-emerald-400 font-bold font-mono">Dispatched successfully</span>
                          </div>
                        </div>

                        {/* Interactive Direct Notification Action Links */}
                        <div className="space-y-3 pt-2">
                          <p className="text-[10.5px] text-indigo-300 font-sans leading-normal">
                            👉 <strong>Highly Recommended:</strong> Click below to verify instantly with Aditya on WhatsApp or Email for complete setup confirmation!
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a
                              href={paymentSuccessData.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open WhatsApp Chat</span>
                            </a>
                            <a
                              href={`mailto:adikumarsharma06@gmail.com,adyukumarsharma123456@gmail.com?subject=Verified%20FamPay%20Payment:%20${paymentSuccessData.plan.toUpperCase()}&body=Sender%20Name:%20${encodeURIComponent(paymentSuccessData.senderName)}%0D%0AUser%20Email:%20${encodeURIComponent(user?.email || '')}%0D%0AUTR%20Ref:%20${encodeURIComponent(paymentSuccessData.utr)}%0D%0ASelected%20Card:%20${paymentSuccessData.plan.toUpperCase()}%0D%0AAmount:%20INR%20${paymentSuccessData.amount}`}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Send Verification Email</span>
                            </a>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setPaymentSuccessData(null);
                            setCheckoutPlan(null);
                            setAuthModalView(null); // Close modal
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold uppercase text-[10px] py-2.5 rounded-xl cursor-pointer"
                        >
                          Return to Workspace
                        </button>
                      </div>
                    ) : checkoutPlan ? (
                      /* VIEW 2: FAMPAY UPI QR PAYMENT INTERFACE */
                      <div className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-md space-y-6 max-w-xl mx-auto animate-fade-in text-left">
                        {/* Header controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <button
                            type="button"
                            onClick={() => {
                              setCheckoutPlan(null);
                              setErrorMsg(null);
                              setPaymentMethod('qr');
                              setManualStep('form');
                            }}
                            className="text-slate-500 hover:text-slate-800 text-[10.5px] font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            ← Back to Tiers
                          </button>
                          <div className="text-right">
                            <span className="text-[9.5px] px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold rounded-full font-mono uppercase tracking-wide flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Secure UPI Escrow Shield
                            </span>
                          </div>
                        </div>

                        {/* Pricing Breakdowns */}
                        <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-indigo-500 font-mono uppercase font-bold tracking-wider block">Premium Card selected</span>
                            <h4 className="text-sm font-sans font-extrabold text-slate-900 mt-0.5">
                              {checkoutPlan === 'pro' ? 'ARES-9 Developer Pro' : 'ARES-9 Enterprise Team'}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-extrabold text-indigo-600 font-mono font-bold">
                              ₹{checkoutPlan === 'pro' ? 99 : 199}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono"> / INR total (Zero Extra Fees)</span>
                          </div>
                        </div>

                        {/* Tab Content 1: QR CODE MODE */}
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Payee Escrow Identity</span>
                                  
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5 animate-fade-in">
                                    <span className="text-[9px] text-slate-400 font-mono block">Registered Beneficiary Name:</span>
                                    <strong className="text-xs text-slate-800 font-sans block">Aditya Sharma</strong>
                                  </div>

                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                                    <div className="min-w-0 mx-1">
                                      <span className="text-[9px] text-slate-400 font-mono block">UPI Handle:</span>
                                      <strong className="text-xs text-indigo-600 font-mono truncate block select-all">
                                        7980259343@fam
                                      </strong>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText('7980259343@fam');
                                        setCopiedUpi(true);
                                        setTimeout(() => setCopiedUpi(false), 2000);
                                        triggerGlobalNotice('UPI Handle Copied: 7980259343@fam');
                                      }}
                                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg shrink-0 cursor-pointer transition-colors"
                                      title="Copy UPI address handle"
                                    >
                                      {copiedUpi ? (
                                        <span className="text-[10px] text-emerald-600 font-bold font-mono">Copied ✓</span>
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-800 leading-normal font-sans">
                                  <strong className="block uppercase tracking-wide text-emerald-600 font-extrabold mb-0.5">🚀 Direct QR Processing:</strong>
                                  No pre-payment form required! Simply scan the QR code to transfer, then enter your Name and transaction UTR reference below to register your premium upgrade instantly in Aditya's billing records.
                                </div>
                              </div>

                              {/* QR Image Frame */}
                              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2 select-none relative overflow-hidden">
                                <div className="absolute top-2 right-2 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                                </div>
                                <div className="w-[170px] h-[170px] bg-white p-2 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                      `upi://pay?pa=7980259343@fam&pn=Aditya%20Sharma&am=${checkoutPlan === 'pro' ? 99 : 199}&cu=INR&tn=ARES9%20${checkoutPlan}%2520Upgrade`
                                    )}`}
                                    alt="UPI scan qr"
                                    className="w-[150px] h-[150px] object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="text-center font-mono">
                                  <span className="text-[10px] text-slate-700 font-bold uppercase tracking-tight block">Scan Code to Pay securely</span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                                    Works with GPay, Paytm, PhonePe, and FamPay
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Interactive Form for QR code scan */}
                            <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Transaction Reference & Proof</span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Your UPI Name / Sender Name</label>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="e.g. Aditya Sharma"
                                      value={senderName}
                                      onChange={(e) => setSenderName(e.target.value)}
                                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400">12-Digit Transaction UTR No.</label>
                                  <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="e.g. 129035234123"
                                      value={payorUtr}
                                      maxLength={20}
                                      onChange={(e) => setPayorUtr(e.target.value.replace(/\D/g, ''))}
                                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all tracking-widest font-bold"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-1.5 items-start text-[9.5px] leading-relaxed text-slate-500 font-sans p-2.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl">
                                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                <span>
                                  By confirming, your payment gets registered in Aditya's accounts database. Diagnostic WhatsApp and Email alerts will be immediately dispatched to <strong>7980259343</strong>!
                                </span>
                              </div>

                              {/* Indian UPI App UTR Help Box */}
                              <div className="p-3 bg-indigo-950/5 border border-indigo-100/80 rounded-xl space-y-1.5 text-slate-600 font-sans text-[9.5px] leading-relaxed">
                                <span className="font-bold text-indigo-600 text-[10px] block font-mono">💡 WHERE TO FIND YOUR 12-DIGIT TRANSACTION UTR?</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 divide-y md:divide-y-0 md:divide-x divide-indigo-100/40">
                                  <div className="pt-1.5 md:pt-0">
                                    <span className="font-bold text-slate-700 block">Google Pay (GPay)</span>
                                    <span>Look under <strong className="text-indigo-600">"UPI Transaction ID"</strong> or "Bank Reference No." starting with your current year prefix (e.g. 6...).</span>
                                  </div>
                                  <div className="pt-1.5 md:pt-0 md:pl-2.5">
                                    <span className="font-bold text-slate-700 block">PhonePe</span>
                                    <span>Open history receipt and copy the 12-digit number listed strictly adjacent to the <strong className="text-indigo-600">"UTR"</strong> field.</span>
                                  </div>
                                  <div className="pt-1.5 md:pt-0 md:pl-2.5">
                                    <span className="font-bold text-slate-700 block">Paytm</span>
                                    <span>Check details screen under <strong className="text-indigo-600">"UPI Ref No"</strong> or copy the bank reference UTR number directly.</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCheckoutPlan(null);
                                    setErrorMsg(null);
                                    triggerGlobalNotice("Payment cancelled. Returned to subscription tiers.");
                                  }}
                                  className="font-mono text-[10px] font-bold uppercase border border-slate-205 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-4 py-3 rounded-xl cursor-pointer transition-all flex-1 text-center"
                                >
                                  Cancel & Dismiss
                                </button>
                                <button
                                  type="submit"
                                  disabled={isLoading}
                                  className={`py-3 px-6 rounded-xl text-center font-mono font-bold text-[10px] uppercase cursor-pointer text-white shadow-md transition-all flex-[2] ${
                                    isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                                  }`}
                                >
                                  {isLoading ? 'Verifying references...' : 'Confirm & Notify Aditya ✓'}
                                </button>
                              </div>
                            </form>
                          </div>

                        {/* Tab Content 2: MANUAL SENDER ENFORCEMENT MODE (DISABLED) */}
                        {false && (
                          <div className="space-y-4 animate-fade-in text-slate-800">
                            {manualStep === 'form' ? (
                              /* Step A: PRE-PAYMENT ACCOUNT FORM (MANDATORY BEFORE SHOWING PAYEE DETAILS) */
                              <div className="space-y-4 border border-rose-100 bg-rose-50/10 p-4 rounded-xl text-left">
                                <div className="space-y-1 border-b border-rose-100/60 pb-2">
                                  <h5 className="text-xs font-mono font-extrabold uppercase text-rose-500 flex items-center gap-1.5">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                    Verification Form Required First
                                  </h5>
                                  <p className="text-[10px] text-slate-500 leading-normal">
                                    To pay directly without a QR code, you must specify your sending bank/UPI account details first. This allows us to map the transaction properly and prevent offline transfer mismatching.
                                  </p>
                                </div>

                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold uppercase text-slate-500">Your Full UPI Name / Sender Name</label>
                                    <div className="relative">
                                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                      <input
                                        type="text"
                                        placeholder="e.g. Aditya Sharma"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold uppercase text-slate-500">Your UPI ID Handle / Sender UPI ID</label>
                                    <div className="relative">
                                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                      <input
                                        type="text"
                                        placeholder="e.g. yourname@ybl or yourphone@paytm"
                                        value={senderUpiId}
                                        onChange={(e) => setSenderUpiId(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCheckoutPlan(null);
                                      setErrorMsg(null);
                                      triggerGlobalNotice("Upgrade cancelled.");
                                    }}
                                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] uppercase font-bold rounded-xl cursor-pointer transition-all flex-1 text-center"
                                  >
                                    Cancel & Return
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!senderName.trim() || !senderUpiId.trim()) {
                                        setErrorMsg("Please fill in both sender full name and UPI handle to unlock manual instructions.");
                                        return;
                                      }
                                      setErrorMsg(null);
                                      setManualStep('details');
                                      triggerGlobalNotice("Sender details verified! Target Payee credentials unlocked successfully.");
                                    }}
                                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] uppercase font-extrabold rounded-xl cursor-pointer transition-all flex-[2] text-center"
                                  >
                                    Confirm Details & View Payee Credentials ➔
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Step B: UNLOCKED DETAILS + DIRECT EMAIL/WHATSAPP MESSAGE */
                              <div className="space-y-4 animate-fade-in">
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-slate-700">
                                  <div className="text-left font-sans text-slate-900">
                                    <span className="text-[8.5px] font-mono uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold">Sender Account Pre-Mapped</span>
                                    <p className="text-xs font-semibold text-slate-705 mt-1">Details: <strong>{senderName}</strong> ({senderUpiId})</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setManualStep('form')}
                                    className="text-[9px] font-bold font-mono text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    Edit Sender details ✏️
                                  </button>
                                </div>

                                <div className="space-y-3 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-slate-400">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                    Validated Payee Account Unlocked
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-slate-900">
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 text-left">
                                      <span className="text-[9px] text-slate-400 font-mono block">Registered beneficiary Name:</span>
                                      <strong className="text-xs text-slate-800 font-sans block font-bold">Aditya Sharma</strong>
                                    </div>

                                    <div className="p-3 bg-white border border-slate-200 rounded-xl relative text-left">
                                      <span className="text-[9px] text-slate-400 font-mono block">FamPay ID Handle:</span>
                                      <strong className="text-xs text-indigo-600 font-mono block truncate select-all font-bold">7980259343@fam</strong>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText('7980259343@fam');
                                          setCopiedUpi(true);
                                          setTimeout(() => setCopiedUpi(false), 2000);
                                          triggerGlobalNotice('UPI ID Handle Copied!');
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                                      >
                                        {copiedUpi ? '✓' : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/80">
                                    <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 block mb-1 flex items-center gap-1 animate-pulse">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                                      CRITICAL ACTION REQUIRED: Send WhatsApp Note
                                    </span>
                                    <p className="text-[10px] text-slate-500 leading-normal mb-3">
                                      Send a quick pre-built alert to payee Aditya Sharma to share payment details and secure continuous offline sync verification feedback:
                                    </p>
                                    
                                    <a
                                      href={`https://wa.me/917980259343?text=${encodeURIComponent(
                                        `Hi Aditya! I am making a manual payment of ₹${checkoutPlan === 'pro' ? 99 : 199} for the ARES-9 ${checkoutPlan?.toUpperCase()} Upgrade.\n\n--- My Account Details ---\n- Name: ${senderName}\n- My UPI ID Handle: ${senderUpiId}\n- Email: ${user?.email || 'N/A'}\n- Plan Chosen: ${checkoutPlan?.toUpperCase()}\n\nPlease verify and help me confirm the transaction. Thank you!`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => triggerGlobalNotice('Opening secure WhatsApp message portal...')}
                                      className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10.5px] uppercase font-black rounded-xl select-none transition-all shadow-md active:scale-95 text-center cursor-pointer"
                                    >
                                      💬 Message Aditya Sharma on WhatsApp for Transfer confirmation
                                    </a>
                                  </div>
                                </div>

                                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-3 border-t border-slate-100 text-left">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono font-bold uppercase text-slate-500">12-Digit Transaction Reference (UTR No.)</label>
                                    <div className="relative">
                                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                      <input
                                        type="text"
                                        placeholder="e.g. 129035234123"
                                        value={payorUtr}
                                        maxLength={20}
                                        onChange={(e) => setPayorUtr(e.target.value.replace(/\D/g, ''))}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all tracking-wider font-extrabold"
                                        required
                                      />
                                    </div>
                                    <span className="text-[9px] text-slate-400 block font-mono">Fill in verified 12-digit UTR obtained after making manual UPI payment.</span>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCheckoutPlan(null);
                                        setErrorMsg(null);
                                        triggerGlobalNotice("Upgrade cancelled.");
                                      }}
                                      className="font-mono text-[10px] font-bold uppercase border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-4 py-3 rounded-xl cursor-pointer transition-all flex-1 text-center"
                                    >
                                      Cancel & Dismiss x
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={isLoading}
                                      className={`py-3 px-6 rounded-xl text-center font-mono font-bold text-[10px] uppercase cursor-pointer text-white shadow-md transition-all flex-[2] ${
                                        isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                                      }`}
                                    >
                                      {isLoading ? 'Verifying references...' : 'Confirm & Notify Aditya ✓'}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* VIEW 4: SUBSCRIPTION PRICING CARD TIERS IN LOCAL ENVIRONMENT */
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* FREE PLAN */}
                              <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                                (!user || user.plan === 'free' || !user.plan) 
                                  ? 'bg-slate-50 border-slate-300 shadow-sm shadow-slate-200/20' 
                                  : 'bg-white border-slate-200/90 hover:border-slate-300'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-sans font-bold text-xs text-slate-400 font-mono tracking-wider uppercase">Free Plan</span>
                                    {(!user || user.plan === 'free' || !user.plan) && (
                                      <span className="text-[8.5px] px-1.5 py-0.5 bg-slate-900 text-white rounded font-bold uppercase tracking-widest leading-none">Active</span>
                                    )}
                                  </div>
                                  <div className="mb-4">
                                    <span className="text-2xl font-extrabold text-slate-900">$0</span>
                                    <span className="text-[10px] text-slate-400 font-mono">/mo</span>
                                  </div>
                                  <ul className="space-y-2 text-[10.5px] text-slate-600 font-sans mb-6">
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span><strong>5 design runs / day</strong></span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Basic AI system compositions</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Save up to <strong>10 projects</strong></span>
                                    </li>
                                  </ul>
                                </div>
                                <button
                                  disabled={!user || user.plan === 'free' || !user.plan || isProActive || isTeamActive || isLoading}
                                  onClick={() => handleUpgradePlan('free')}
                                  className={`w-full py-2 rounded-xl text-center font-mono font-bold text-[10.5px] uppercase transition-all ${
                                    (!user || user.plan === 'free' || !user.plan)
                                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                      : (isProActive || isTeamActive)
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                                      : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-sm'
                                  }`}
                                >
                                  {(isProActive || isTeamActive) ? 'Standard Blocked' : (!user || user.plan === 'free' || !user.plan) ? 'Current Plan' : 'Downgrade'}
                                </button>
                              </div>

                              {/* PRO PLAN */}
                              <div className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
                                isProActive
                                  ? 'bg-indigo-50/20 border-indigo-400 shadow-md shadow-indigo-100/30'
                                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                              }`}>
                                {/* LOCKED OVERLAY if alternative plan is active */}
                                {isTeamActive && (
                                  <div className="absolute inset-0 bg-slate-950/15 backdrop-blur-[1.5px] rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 transition-all duration-300 select-none">
                                    <div className="bg-slate-950 text-white p-2.5 rounded-full shadow-xl border border-slate-750 mb-2.5">
                                      <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
                                    </div>
                                    <p className="font-mono text-[10.5px] font-black text-slate-900 uppercase tracking-tight bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-md max-w-[90%] leading-relaxed">
                                      Locked (Pro 30-Day Limits)
                                    </p>
                                    <p className="text-[8.5px] font-medium text-slate-500 bg-white/95 px-2 py-1 rounded-lg border border-slate-150 mt-1.5 max-w-[85%] leading-relaxed">
                                      Only one active premium plan allowed. Unlockable when active Team subscription ends.
                                    </p>
                                  </div>
                                )}

                                <div className="absolute top-0 right-5 -translate-y-1/2 bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full leading-none shadow-sm">
                                  {isProActive ? 'Your Active Plan' : 'Popular Price'}
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-sans font-bold text-xs text-indigo-500 font-mono tracking-wider uppercase font-bold">Pro Plan</span>
                                    {isProActive && (
                                      <span className="text-[8.5px] px-1.5 py-0.5 bg-indigo-600 text-white rounded font-bold uppercase tracking-widest leading-none">Active</span>
                                    )}
                                  </div>
                                  <div className="mb-4">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-2xl font-extrabold text-slate-900">₹99</span>
                                      <span className="text-[10px] text-slate-400 font-mono">/30 days</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-500 font-mono italic block mt-0.5 font-bold">Duration: 30 Days of premium access</span>
                                  </div>
                                  <ul className="space-y-2 text-[10.5px] text-slate-600 font-sans mb-6">
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span><strong>Unlimited project designs</strong></span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Advanced system workflows</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span><strong>Export PDF, Docs & code</strong></span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Priority AI processing speed</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Deep AI project memory context</span>
                                    </li>
                                  </ul>
                                </div>

                                {isProActive ? (
                                  <button
                                    disabled
                                    className="w-full py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-center font-mono font-bold text-[10px] uppercase cursor-not-allowed shadow-inner"
                                  >
                                    🔒 Active (No Stacking)
                                  </button>
                                ) : (
                                  <button
                                    disabled={!user || isLoading || isTeamActive}
                                    onClick={() => {
                                      setCheckoutPlan('pro');
                                      setSenderName(user?.name || '');
                                      triggerGlobalNotice('Opening FamPay Secure UPI Payment modal...');
                                    }}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center font-mono font-bold text-[10.5px] uppercase cursor-pointer hover:shadow transition-all"
                                  >
                                    Upgrade to Pro
                                  </button>
                                )}
                              </div>

                              {/* TEAM PLAN */}
                              <div className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
                                isTeamActive
                                  ? 'bg-amber-50/20 border-amber-400 shadow-md shadow-amber-100/30'
                                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                              }`}>
                                {/* LOCKED OVERLAY if alternative plan is active */}
                                {isProActive && (
                                  <div className="absolute inset-0 bg-slate-950/15 backdrop-blur-[1.5px] rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 transition-all duration-300 select-none">
                                    <div className="bg-slate-950 text-white p-2.5 rounded-full shadow-xl border border-slate-750 mb-2.5">
                                      <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
                                    </div>
                                    <p className="font-mono text-[10.5px] font-black text-slate-900 uppercase tracking-tight bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-md max-w-[90%] leading-relaxed">
                                      Locked (Team 60-Day Limits)
                                    </p>
                                    <p className="text-[8.5px] font-medium text-slate-500 bg-white/95 px-2 py-1 rounded-lg border border-slate-150 mt-1.5 max-w-[85%] leading-relaxed">
                                      Only one active premium plan allowed. Unlockable when active Pro subscription ends.
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-sans font-bold text-xs text-amber-600 font-mono tracking-wider uppercase font-bold">Team Plan</span>
                                    {isTeamActive && (
                                      <span className="text-[8.5px] px-1.5 py-0.5 bg-amber-500 text-white rounded font-bold uppercase tracking-widest leading-none">Active</span>
                                    )}
                                  </div>
                                  <div className="mb-4">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-2xl font-extrabold text-slate-900">₹199</span>
                                      <span className="text-[10px] text-slate-400 font-mono">/60 days</span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-mono italic block mt-0.5 font-bold">Duration: 60 Days of enterprise sync space</span>
                                  </div>
                                  <ul className="space-y-2 text-[10.5px] text-slate-600 font-sans mb-6">
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span><strong>Everything in Pro</strong> for teams</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span><strong>Shared team workspaces</strong></span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span><strong>Real team collaboration</strong></span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Workspace admin dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>Audit trails & live telemetry logs</span>
                                    </li>
                                  </ul>
                                </div>

                                {isTeamActive ? (
                                  <button
                                    disabled
                                    className="w-full py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-center font-mono font-bold text-[10px] uppercase cursor-not-allowed shadow-inner"
                                  >
                                    🔒 Active (No Stacking)
                                  </button>
                                ) : (
                                  <button
                                    disabled={!user || isLoading || isProActive}
                                    onClick={() => {
                                      setCheckoutPlan('team');
                                      setSenderName(user?.name || '');
                                      triggerGlobalNotice('Opening FamPay Secure UPI Payment modal...');
                                    }}
                                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-center font-mono font-bold text-[10.5px] uppercase cursor-pointer hover:shadow transition-all"
                                  >
                                    Go Team
                                  </button>
                                )}
                              </div>
                            </div>

                        {/* Interactive Audit Entry Portal for Owner */}
                        <div className="pt-4 border-t border-slate-200/60 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/40 via-indigo-50/10 to-amber-50/30 p-4 rounded-2xl border border-indigo-150">
                          <div className="text-left flex-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 animate-bounce text-amber-500" />
                              Secure Merchant Dashboard & Interactive Aura Tester
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                              Simulate pending FamPay payments and UTR logs. Plus, instantly test the lock-unlock aura visual effects or trigger near-expiry alert banners!
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('ares-trigger-unlock-animation', { detail: { plan: user?.plan && user.plan !== 'free' ? user.plan : 'pro' } }));
                                triggerGlobalNotice(`Visualizing master lock unlock aura animation for: ${(user?.plan && user.plan !== 'free' ? user.plan : 'pro').toUpperCase()} card.`);
                              }}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] uppercase font-bold rounded-xl cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              ⚡ Replay Aura
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  let res = await fetch('/api/auth/simulate-expiry', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ minutes: 3 })
                                  });
                                  if (res.ok) {
                                    let data = await res.json();
                                    setUser(data.user);
                                    window.dispatchEvent(new CustomEvent('ares-user-plan-updated', { detail: { plan: data.user.plan, planExpiresAt: data.user.planExpiresAt } }));
                                    triggerGlobalNotice('Subscription set to expire in 3 minutes! Verify the expiry countdown notice.');
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-mono text-[9px] uppercase font-bold rounded-xl cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              ⏳ Expire in 3m
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAdminOpen(true);
                                setErrorMsg(null);
                                setSuccessMsg(null);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>FamPay Logs</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {authModalView === 'history' && (
                  <div className="space-y-6">
                    {/* Switcher back to Plans / Tiers */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <div>
                        <span className="text-[10px] bg-slate-200 text-slate-850 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Account Tier Status
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-600 font-sans">Current Subscription Segment:</span>
                          <span className="text-xs font-black font-sans text-indigo-600 uppercase flex items-center gap-1 bg-indigo-50 leading-none p-1 px-2.5 rounded-lg border border-indigo-150">
                            <Zap className="w-3 h-3 text-indigo-500 animate-pulse" />
                            {user?.plan ? user.plan.toUpperCase() : 'FREE'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setAuthModalView('plans');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-600 hover:border-indigo-500 text-white hover:text-white px-4 py-2 rounded-xl text-[10.5px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-105 transition-all flex items-center gap-2 shrink-0 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>View Subscription Plans</span>
                      </button>
                    </div>

                    {/* Error & Success Messages within history view */}
                    {errorMsg && (
                      <div className="p-3.5 bg-rose-50 border border-rose-150 text-rose-750 text-[11px] rounded-xl flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-550" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-850 text-[11px] rounded-xl flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <div className="space-y-1">
                          <span className="font-bold">{successMsg}</span>
                          <p className="text-[9.5px] text-emerald-700 font-sans leading-relaxed">
                            A secure text compilation of your payments database profile has been processed. You can review the dispatch details in the local developer container runtime logs.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Outgoing Export triggers */}
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50/50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-left space-y-1">
                        <h4 className="text-xs font-sans font-bold text-slate-800 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-emerald-600" />
                          Secure Invoicing Export
                        </h4>
                        <p className="text-[10.5px] text-slate-500 font-sans leading-relaxed">
                          Request a clean cryptographic text invoice dispatch of all subscription transactions directly to your registered mailbox.
                        </p>
                        <div className="flex flex-col gap-1 text-[9.5px] font-mono text-slate-400">
                          <span>Verified Target Emails (Alerted on Purchase):</span>
                          <span className="text-slate-600 block">
                            • <strong className="select-all font-bold">adikumarsharma06@gmail.com</strong> <br />
                            • <strong className="select-all font-bold">adyukumarsharma123456@gmail.com</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleExportMyPurchaseHistory}
                        disabled={exportLoading || myPaymentsLoading}
                        className={`font-mono font-bold text-[10.5px] uppercase py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95 shadow-sm text-white ${
                          exportLoading 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-50'
                        }`}
                      >
                        {exportLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Exporting Database...</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Export History to Email</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Invoice items list */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold tracking-wider">
                        Registered Purchase Transactions Log
                      </span>

                      {myPaymentsLoading ? (
                        <div className="py-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                          <span className="text-[10.5px] font-mono text-slate-500">Querying your receipts ledger...</span>
                        </div>
                      ) : myPayments.length === 0 ? (
                        <div className="py-12 bg-white border border-slate-200 p-6 rounded-2xl text-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                          <h4 className="text-xs font-sans font-bold text-slate-800 font-bold">No Premium Receipts Found</h4>
                          <p className="text-[10px] text-slate-550 font-sans leading-relaxed max-w-sm mx-auto">
                            You currently have no processed FamPay UPI payment receipts. Upgrading your account to Pro or Team will instantiate instant receipt tracking logs here!
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => setAuthModalView('plans')}
                              className="px-4 py-2 bg-indigo-55 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-150 text-[10px] font-mono font-bold uppercase rounded-lg cursor-pointer transition-colors"
                            >
                              Browse Plans & Upgrade Now
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {myPayments.map((pay: any) => (
                            <div 
                              key={pay.id} 
                              className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-indigo-200 hover:shadow-sm transition-all text-slate-850"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-slate-900 font-sans font-bold">
                                      {pay.plan === 'pro' ? 'ARES-9 Developer Pro' : 'ARES-9 Enterprise Team'}
                                    </span>
                                    <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-full font-mono font-bold uppercase tracking-wider">
                                      {pay.plan.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                    Submitted by: <strong className="text-slate-705 text-slate-700">{pay.senderName}</strong>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-extrabold text-indigo-600 font-mono font-bold">₹{pay.amountInINR} INR</span>
                                  <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">
                                    {new Date(pay.submittedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[10px] font-mono">
                                <div>
                                  <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Transaction Reference (UTR)</span>
                                  <span className="text-slate-700 font-bold select-all tracking-wider">{pay.utr}</span>
                                </div>
                                <div>
                                  <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Fampay Payment Date</span>
                                  <span className="text-slate-600">{new Date(pay.submittedAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-mono">Status:</span>
                                  {pay.status === 'pending' && (
                                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50 font-bold font-mono text-[9px] uppercase">
                                      Pending Verification
                                    </span>
                                  )}
                                  {pay.status === 'approved' && (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250/50 font-bold font-mono text-[9px] uppercase">
                                      Verified ✓
                                    </span>
                                  )}
                                  {pay.status === 'rejected' && (
                                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50 font-bold font-mono text-[9px] uppercase">
                                      Rejected
                                    </span>
                                  )}
                                </div>

                                <a
                                  href={`mailto:adikumarsharma06@gmail.com,adyukumarsharma123456@gmail.com?subject=Inquiry%20Receipt:%2520${pay.id}&body=Hi%2520Aditya%2520Sharma,%250D%250A%250D%250APlease%2520assist%2520me%2520with%2520my%2520ARES-9%2520subscription%2520receipt%2520verification:%250D%250A-%2520Receipt%2520ID:%2520${pay.id}%250D%250A-%2520Card%2520Type:%2520${pay.plan.toUpperCase()}%250D%250A-%2520UTR%2520Number:%2520${pay.utr}%250D%250A-%2520Sender:%2520${encodeURIComponent(pay.senderName)}`}
                                  className="text-slate-400 hover:text-indigo-600 font-mono text-[9.5px] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Inquire Aditya</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Secure Footer Information */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 border-slate-200/60 font-mono text-[9.5px] text-slate-400 flex items-center justify-between">
                <span>SSL / HTTPS Client Connected</span>
                <span>ISO Security Compliant</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
