import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  FileJson, 
  RefreshCw,
  FolderOpen,
  ArrowRightLeft,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MultiAgentSystem } from '../types';

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
}

interface SavedProjectsDashboardProps {
  currentSystem: MultiAgentSystem | null;
  currentTaskQuery: string;
  onLoadProject: (project: Project, output: MultiAgentSystem) => void;
  triggerNotice: (msg: string) => void;
}

export const SavedProjectsDashboard: React.FC<SavedProjectsDashboardProps> = ({
  currentSystem,
  currentTaskQuery,
  onLoadProject,
  triggerNotice,
}) => {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('ares_auth_token'));
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // Save modal/inputs states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync token changes
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthToken(localStorage.getItem('ares_auth_token'));
    };
    window.addEventListener('ares-auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('ares-auth-changed', handleAuthChange);
    };
  }, []);

  // Fetch projects list of active logged-in user
  const fetchProjects = async () => {
    const token = localStorage.getItem('ares_auth_token');
    if (!token) {
      setProjects([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else if (res.status === 401) {
        setProjects([]);
        setAuthToken(null);
        localStorage.removeItem('ares_auth_token');
      }
    } catch (err) {
      console.error('[ProjectsListError] Failed retrieving space:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProjectId(null);
    }
  }, [authToken]);

  // Handle saving project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('ares_auth_token');
    if (!token) {
      triggerNotice('Please log in using the Hub header to commit saves.');
      return;
    }
    if (!newTitle.trim()) {
      triggerNotice('Project Title must be specified.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: newTitle,
        description: newDesc,
        output_data: currentSystem || {
          task: currentTaskQuery || 'Dynamic multi-agent setup',
          agents: [],
          gates: [],
          edges: [],
          failureHandling: {
            maxRetryBudgets: 3,
            fallbackTriggerPolicy: 'Trigger automated circuit-breaker fallback node.',
            alertingChannels: ['developer-terminal-logs'],
            circuitBreakerConditions: 'Execution failure rate exceeding 40% on nodes.'
          },
          optimization: {
            promptWrapping: 'Bespoke custom compiler wrapped with system role instructions.',
            cachingStrategy: 'Edge API caching of baseline outputs (120s TTL).',
            parallelizationOpportunity: 'Concurrent validation trace mapping.'
          }
        },
        project_id: activeProjectId // Sends active project id to update/overwrite
      };

      const res = await fetch('/api/projects/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        triggerNotice(activeProjectId ? 'Project content updated successfully!' : 'Project registered in Dashboard database!');
        setActiveProjectId(data.project.id);
        fetchProjects();
        setIsSaveModalOpen(false);
        setNewTitle('');
        setNewDesc('');
      } else {
        triggerNotice(data.error || 'Failed saving project.');
      }
    } catch (err) {
      triggerNotice('Error executing cloud save transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  // Pre-fill fields for saving
  const initiateSave = () => {
    if (!authToken) {
      triggerNotice('Authorization required. Use user login badge first.');
      return;
    }
    
    // If active loaded project exists, default to its metadata
    if (activeProjectId) {
      const existing = projects.find(p => p.id === activeProjectId);
      if (existing) {
        setNewTitle(existing.title);
        setNewDesc(existing.description);
      }
    } else {
      setNewTitle(currentTaskQuery ? `ARES - ${currentTaskQuery.substring(0, 30)}...` : '');
      setNewDesc('');
    }
    setIsSaveModalOpen(true);
  };

  // Handle loading project
  const handleLoadProject = async (projId: string) => {
    const token = localStorage.getItem('ares_auth_token');
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/load/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProjectId(projId);
        onLoadProject(data.project, data.output);
        triggerNotice(`Loaded project space: "${data.project.title}"`);
      } else {
        triggerNotice('Failed loading project outputs.');
      }
    } catch (err) {
      triggerNotice('Network disruption loading workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting project
  const handleDeleteProject = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering Load load
    const token = localStorage.getItem('ares_auth_token');
    if (!token) return;

    if (!confirm('Are you sure you want to permanently delete this project record?')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerNotice('Project erased from telemetry index.');
        if (activeProjectId === projId) {
          setActiveProjectId(null);
        }
        fetchProjects();
      } else {
        triggerNotice('Delete transaction rejected.');
      }
    } catch (err) {
      triggerNotice('Workspace disconnect during delete transaction.');
    }
  };

  // Unload/new project action
  const resetWorkspace = () => {
    setActiveProjectId(null);
    triggerNotice('Unloaded active session dashboard references.');
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/60">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1.5">
              Saved Projects Dashboard
              {authToken && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded-full">
                  {projects.length} Registered
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Save architectures & multi-agent system traces to database to load or review later.
            </p>
          </div>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center gap-2">
          {authToken && (
            <button
              onClick={() => fetchProjects()}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Refresh project list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={initiateSave}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-900 hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>{activeProjectId ? 'Overwrite Save' : 'Save Current Design'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      {!authToken ? (
        // Login prompt spacer
        <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">AUTHENTICATION DISCONNECTED</h4>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Log in with secure verification hashes via the top-right <strong className="text-slate-800 font-semibold">User Sign In</strong> badge to manage, view, save, and reload custom system architectures.
            </p>
          </div>
        </div>
      ) : (
        // Search and Lists
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved architectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-2xl text-xs font-sans focus:outline-none transition-all text-slate-800"
            />
          </div>

          {isLoading && projects.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
              <span>Verifying secure workspace connection ...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 text-slate-450 text-slate-400 space-y-1.5">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-sans font-medium">No archived designs found.</p>
              <p className="text-[11px] font-sans text-slate-400">
                {searchQuery ? 'Adjust search query parameter filters.' : 'Click "Save Current Design" above to archive this multi-agent output.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadProject(proj.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group h-full relative ${
                      isActive 
                        ? 'bg-slate-950 border-slate-950 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      {/* Active indicator */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {isActive ? 'ACTIVE DESIGN' : 'ARCHIVED'}
                        </span>

                        <span className={`text-[9px] font-mono flex items-center gap-1 ${
                          isActive ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {new Date(proj.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <h4 className="font-sans font-bold text-xs truncate group-hover:text-indigo-400 transition-colors">
                        {proj.title}
                      </h4>
                      
                      <p className={`text-[11px] font-sans mt-1 line-clamp-2 leading-relaxed ${
                        isActive ? 'text-slate-305 text-slate-300' : 'text-slate-500'
                      }`}>
                        {proj.description || 'No custom blueprint system documentation added.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-1 border-slate-100 group-hover:border-indigo-100/20">
                      <span className={`text-[10px] font-mono flex items-center gap-1 font-semibold ${
                        isActive ? 'text-emerald-300' : 'text-slate-600 group-hover:text-indigo-650 text-indigo-600'
                      }`}>
                        <span>Load Workspace</span>
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </span>

                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className={`p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-all border border-transparent ${
                          isActive ? 'hover:bg-slate-800 text-slate-400' : ''
                        }`}
                        title="Permanently remove project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeProjectId && (
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[10.5px] font-mono font-semibold text-slate-505 text-slate-500">
                Editing loaded project workspace context.
              </span>
              <button
                onClick={resetWorkspace}
                className="text-[10px] font-mono font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3 h-3" />
                Unlink Dashboard Reference
              </button>
            </div>
          )}
        </div>
      )}

      {/* SAVE METADATA FORM MODAL */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm shadow-2xl"
              onClick={() => setIsSaveModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-20 flex flex-col bg-gradient-to-b from-white to-slate-50"
            >
              <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between border-b border-indigo-950/20 bg-gradient-to-r from-slate-950 to-indigo-950">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <Save className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-100">
                      {activeProjectId ? 'Update Project Overwrite' : 'Archive New System Scope'}
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-widest">
                      PERSIST MULTI-AGENT SPECIFICATION
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProject} className="p-6 md:p-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Project Title</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Cognitive E-Commerce Routing Engine"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">System Description / Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Bespoke planning node coupled with continuous validator checks."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:border-indigo-400 transition-all text-slate-800 resize-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-200/40 text-[10.5px] text-indigo-900 leading-normal space-y-1">
                  <div className="font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Payload Verification
                  </div>
                  <p className="font-sans text-[11px] text-slate-600">
                    Saving encodes the current active workspace trace. That means you can log off, change browsers, and load this identical multi-agent graph with all simulated steps on-demand!
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold uppercase text-xs py-3.5 rounded-2xl cursor-pointer transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-1/2 bg-slate-950 hover:bg-slate-850 text-white font-mono font-bold uppercase text-xs py-3.5 rounded-2xl cursor-pointer transition-all text-center flex items-center justify-center"
                  >
                    {isSaving ? 'Encrypting & Saving...' : 'Confirm Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
