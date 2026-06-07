import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Trash2, 
  Plus, 
  Mail, 
  Shield, 
  Clock, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  Compass,
  FileCheck2,
  FolderLock
} from 'lucide-react';

interface WorkspaceMember {
  userId: string;
  email: string;
  role: 'admin' | 'collaborator';
}

interface Workspace {
  id: string;
  name: string;
  createdBy: string;
  members: WorkspaceMember[];
  createdAt: string;
}

interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

interface TeamWorkspaceDashboardProps {
  triggerNotice: (msg: string) => void;
}

export const TeamWorkspaceDashboard: React.FC<TeamWorkspaceDashboardProps> = ({ triggerNotice }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Loading & states
  const [loading, setLoading] = useState<boolean>(false);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'collaborator'>('collaborator');
  
  // API connection alerts
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [successLocal, setSuccessLocal] = useState<string | null>(null);

  const token = localStorage.getItem('ares_auth_token');

  // Fetch all workspaces
  const fetchWorkspaces = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorLocal(null);
      const res = await fetch('/api/projects/my-workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        if (data.length > 0) {
          // Keep current selection or fallback to first
          if (selectedWorkspace) {
            const updated = data.find((w: any) => w.id === selectedWorkspace.id);
            setSelectedWorkspace(updated || data[0]);
          } else {
            setSelectedWorkspace(data[0]);
          }
        } else {
          setSelectedWorkspace(null);
        }
      } else {
        const err = await res.json();
        setErrorLocal(err.error || 'Failed fetching workspaces.');
      }
    } catch (err) {
      setErrorLocal('Could not connect to workspaces service.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit trail logs
  const fetchAuditLogs = async (workspaceId: string) => {
    if (!token) return;
    try {
      setLogsLoading(true);
      const res = await fetch(`/api/projects/workspace-audit-logs/${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed fetching workspace audit trail logs list', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchAuditLogs(selectedWorkspace.id);
    } else {
      setAuditLogs([]);
    }
  }, [selectedWorkspace?.id]);

  // Handle Workspace creation
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newWorkspaceName.trim()) return;
    try {
      setLoading(true);
      setErrorLocal(null);
      setSuccessLocal(null);
      const res = await fetch('/api/projects/create-workspace', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newWorkspaceName.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setNewWorkspaceName('');
        setSuccessLocal(`Workspace "${data.workspace.name}" created successfully.`);
        triggerNotice(`Team Workspace "${data.workspace.name}" activated.`);
        await fetchWorkspaces();
        setSelectedWorkspace(data.workspace);
      } else {
        const err = await res.json();
        setErrorLocal(err.error || 'Failed creating workspace.');
      }
    } catch (err) {
      setErrorLocal('Network error creating workspace.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Member invitation
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedWorkspace || !inviteEmail.trim()) return;
    try {
      setErrorLocal(null);
      setSuccessLocal(null);
      const res = await fetch('/api/projects/invite-workspace-member', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          email: inviteEmail.trim(),
          role: inviteRole
        })
      });
      if (res.ok) {
        setInviteEmail('');
        setSuccessLocal(`Successfully invited ${inviteEmail} to the collaborative workspace.`);
        triggerNotice(`Member added to "${selectedWorkspace.name}".`);
        await fetchWorkspaces();
      } else {
        const err = await res.json();
        setErrorLocal(err.error || 'Failed inviting collaborator.');
      }
    } catch (err) {
      setErrorLocal('Network error inviting teammate.');
    }
  };

  // Handle Member removal
  const handleRemoveMember = async (targetUserId: string, memberEmail: string) => {
    if (!token || !selectedWorkspace) return;
    if (!window.confirm(`Are you sure you want to revoke workspace access for ${memberEmail}?`)) return;
    try {
      setErrorLocal(null);
      setSuccessLocal(null);
      const res = await fetch('/api/projects/remove-workspace-member', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          userId: targetUserId
        })
      });
      if (res.ok) {
        setSuccessLocal(`Revoked workspace permissions for ${memberEmail}.`);
        triggerNotice(`Collaborator removed.`);
        await fetchWorkspaces();
      } else {
        const err = await res.json();
        setErrorLocal(err.error || 'Failed removing workspace member.');
      }
    } catch (err) {
      setErrorLocal('Network error removing collaborator.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upper Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-900/35 text-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-505/20 border-indigo-500/20">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block font-mono">Workspace Seats</span>
            <span className="text-lg font-extrabold font-sans">
              {selectedWorkspace ? selectedWorkspace.members.length : 0} Seat(s) Active
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 rounded-2xl border border-slate-800 text-slate-150 text-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-slate-800/60 rounded-xl text-slate-400 border border-slate-700/50">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block font-mono">Telemetry Log Stream</span>
            <span className="text-lg font-extrabold font-sans">
              Status Online
            </span>
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-200/5 hover:border-slate-200/10 text-slate-100 shadow-sm flex items-center gap-3 md:col-span-2">
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            🎓 <strong>Admin Quick Tip:</strong> Changes made here reflect instantly across all active developer accounts. Shared Workspace systems synchronize workflows dynamically.
          </p>
        </div>
      </div>

      {/* Global Alert System inside panel */}
      {errorLocal && (
        <div className="p-3.5 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-250 border-rose-250 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorLocal}</span>
        </div>
      )}
      {successLocal && (
        <div className="p-3.5 bg-emerald-50 text-emerald-850 text-emerald-805 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-255 border-emerald-200 flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successLocal}</span>
        </div>
      )}

      {/* Side-by-Side Control Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Workspaces List Drawer (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-400" /> My Workspaces
            </h4>
            <button
              onClick={fetchWorkspaces}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              title="Refresh lists"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Form to create a workspace */}
          <form onSubmit={handleCreateWorkspace} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Enterprise Alpha Devs..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                maxLength={40}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                title="Create Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* List of Workspaces */}
          <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
            {workspaces.map((ws) => {
              const isSelected = selectedWorkspace?.id === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => setSelectedWorkspace(ws)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-750 text-slate-75 *:'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold truncate font-sans">{ws.name}</span>
                    <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-white/10 text-slate-300' : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {ws.members.length} member(s)
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono block ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                    ID: {ws.id.substring(0, 8)}...
                  </span>
                </button>
              );
            })}
            {workspaces.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs font-sans border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1">
                <FolderLock className="w-5 h-5 text-slate-300" />
                <span>No active collaborative spaces.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Selected Workspace Details & Audit Trace (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          {selectedWorkspace ? (
            <>
              {/* Workspace Header Info */}
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-sans font-extrabold text-slate-950 text-lg leading-tight flex items-center gap-2">
                    {selectedWorkspace.name} 
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full">
                      ACTIVE WORKSPACE
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span>UUID: {selectedWorkspace.id}</span>
                    <span>•</span>
                    <span>Created: {new Date(selectedWorkspace.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Members Management Console */}
                <div className="space-y-4">
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" /> Teaming & Invitation
                  </h4>

                  {/* Invite teammate form */}
                  <form onSubmit={handleInviteMember} className="space-y-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-mono font-bold uppercase text-slate-400 block">Workspace Invite Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          placeholder="developer@customer.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:bg-white rounded-xl text-xs font-sans focus:outline-none focus:border-indigo-400 text-slate-850"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex gap-2 bg-white p-0.5 border border-slate-150 rounded-lg text-[10px]">
                        <button
                          type="button"
                          onClick={() => setInviteRole('collaborator')}
                          className={`px-2 py-1 rounded transition-colors ${
                            inviteRole === 'collaborator' ? 'bg-slate-900 text-white font-bold' : 'text-slate-500'
                          }`}
                        >
                          Collaborator
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteRole('admin')}
                          className={`px-2 py-1 rounded transition-colors ${
                            inviteRole === 'admin' ? 'bg-slate-905 bg-slate-900 text-white font-bold' : 'text-slate-500'
                          }`}
                        >
                          Workspace Admin
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm shrink-0 cursor-pointer transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Invite
                      </button>
                    </div>
                  </form>

                  {/* Teammate Seats list */}
                  <div className="space-y-1.5">
                    <p className="text-[9.5px] font-mono font-bold uppercase text-slate-450 text-slate-400">Workspace User Directory</p>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {selectedWorkspace.members.map((member) => (
                        <div
                          key={member.userId}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150/70 rounded-xl text-xs flex justify-between items-center transition-all"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="p-1 bg-white border border-slate-150 rounded-lg text-slate-400 text-[10px] uppercase font-bold shrink-0">
                              {member.email.charAt(0)}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold block text-slate-800 truncate leading-none mb-0.5">{member.email}</span>
                              <span className="text-[8.5px] text-slate-405 text-slate-400 font-mono leading-none flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-indigo-400" /> {member.role.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveMember(member.userId, member.email)}
                            className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Revoke Teammate Seat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Audit Trail Console */}
                <div className="space-y-4">
                  <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" /> Admin Audit Logs
                    </span>
                    <span className="text-[8.5px] font-mono bg-slate-100 text-slate-500 p-1 rounded font-bold uppercase">
                      SECURE TELEMETRY
                    </span>
                  </h4>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 font-mono text-[10px] text-slate-400 flex flex-col h-[320px]">
                    <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-2 text-slate-400">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-bold tracking-widest uppercase">AUDIT_LOG_SHELL_v1.0.8</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {logsLoading ? (
                        <div className="h-full flex items-center justify-center text-slate-600 gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
                          <span>Streaming secure events...</span>
                        </div>
                      ) : auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <div key={log.id} className="border-b border-slate-900/60 pb-1.5 text-[9px] hover:text-slate-200">
                            <span className="text-indigo-400 font-bold block">
                              [{new Date(log.timestamp).toLocaleTimeString()}] {log.userEmail.split('@')[0]}
                            </span>
                            <p className="text-slate-300 mt-0.5 leading-relaxed font-semibold">
                              &gt; {log.action}: {log.details}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center gap-1 pt-8 select-none">
                          <code className="text-[14px] text-slate-700 block">&gt;_</code>
                          <span>Terminal queue empty. Secure action logs will streaming here chronologically when members complete workspace actions.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs font-sans border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-1.5 max-w-md mx-auto">
              <FolderLock className="w-8 h-8 text-slate-300 animate-pulse" />
              <h5 className="font-semibold text-slate-705 text-slate-700">Audit Desk Inactive</h5>
              <p className="max-w-xs leading-relaxed text-[11px] text-slate-500">
                You do not have any collaborative Team workspaces. Type a custom workspace title in the menu on the left to activate your safe environment instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
