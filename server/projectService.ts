import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireSession } from './authService.js';
import { persistRecordToFirestore, syncCollectionToLocal, deleteRecordFromFirestore } from './firebaseDb.js';

const PROJECTS_FILE = path.join(process.cwd(), 'projects-db.json');
const OUTPUTS_FILE = path.join(process.cwd(), 'project-outputs-db.json');
const WORKSPACES_FILE = path.join(process.cwd(), 'workspaces-db.json');
const AUDIT_LOGS_FILE = path.join(process.cwd(), 'workspace-audit-logs-db.json');

export interface ProjectRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  workspace_id?: string;
}

export interface ProjectOutputRecord {
  id: string;
  project_id: string;
  output_data: string; // Dynamic JSON string of MultiAgentSystem
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  owner_id: string;
  members: string[]; // User emails
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  timestamp: string;
}

let projects: ProjectRecord[] = [];
let outputs: ProjectOutputRecord[] = [];
let workspaces: WorkspaceRecord[] = [];
let auditLogs: AuditLogRecord[] = [];

function getUserPlan(userId: string): 'free' | 'pro' | 'team' {
  try {
    const usersFile = path.join(process.cwd(), 'users-db.json');
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      const user = users.find((u: any) => u.id === userId);
      return user?.plan || 'free';
    }
  } catch (err) {
    console.error('Error fetching user plan:', err);
  }
  return 'free';
}

function loadDbs() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    } else {
      projects = [];
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
    }

    if (fs.existsSync(OUTPUTS_FILE)) {
      outputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf-8'));
    } else {
      outputs = [];
      fs.writeFileSync(OUTPUTS_FILE, JSON.stringify([]));
    }

    if (fs.existsSync(WORKSPACES_FILE)) {
      workspaces = JSON.parse(fs.readFileSync(WORKSPACES_FILE, 'utf-8'));
    } else {
      workspaces = [];
      fs.writeFileSync(WORKSPACES_FILE, JSON.stringify([]));
    }

    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      auditLogs = JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
    } else {
      auditLogs = [];
      fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify([]));
    }
  } catch (err) {
    console.error('[ProjectsDB] Refusing to crash. Initializing empty:', err);
    projects = [];
    outputs = [];
    workspaces = [];
    auditLogs = [];
  }
}

function saveProjects() {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ProjectsDB] Error saving projects:', err);
  }
}

function saveOutputs() {
  try {
    fs.writeFileSync(OUTPUTS_FILE, JSON.stringify(outputs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ProjectsDB] Error saving outputs:', err);
  }
}

function saveWorkspaces() {
  try {
    fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(workspaces, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WorkspacesDB] Error saving workspaces:', err);
  }
}

function saveAuditLogs() {
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(auditLogs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AuditLogsDB] Error saving audit logs:', err);
  }
}

function logWorkspaceAction(workspaceId: string, userId: string, userEmail: string, action: string, details: string) {
  const newLog: AuditLogRecord = {
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    user_id: userId,
    user_email: userEmail,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  auditLogs.push(newLog);
  saveAuditLogs();
  persistRecordToFirestore('workspace_audit_logs', newLog);
}

// Initial Bootup load
loadDbs();
Promise.all([
  syncCollectionToLocal('projects', projects, saveProjects),
  syncCollectionToLocal('project_outputs', outputs, saveOutputs),
  syncCollectionToLocal('workspaces', workspaces, saveWorkspaces),
  syncCollectionToLocal('workspace_audit_logs', auditLogs, saveAuditLogs)
]).then(() => {
  console.log('[ProjectsDB] All project assets, collaborative workspaces, and audit trails synced with live Firestore.');
});

const router = express.Router();

// A. Create or Save project (with premium limit validation)
router.post('/save', requireSession, (req: any, res) => {
  try {
    const { title, description, output_data, project_id, workspace_id } = req.body;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';
    const userPlan = getUserPlan(userId);

    if (!title) {
      res.status(400).json({ error: 'Project title is required.' });
      return;
    }

    // Load workspaces where the active user has access
    const accessibleWorkspaceIds = workspaces
      .filter(w => w.owner_id === userId || w.members.map(m => m.toLowerCase().trim()).includes(userEmail))
      .map(w => w.id);

    let project: ProjectRecord | undefined;
    
    if (project_id) {
       // Update existing
       project = projects.find(p => p.id === project_id && (p.user_id === userId || (p.workspace_id && accessibleWorkspaceIds.includes(p.workspace_id))));
    }

    const isNew = !project;

    // Enforce limits for free plan
    if (userPlan === 'free' && isNew) {
      const userProjs = projects.filter(p => p.user_id === userId);
      if (userProjs.length >= 10) {
        res.status(403).json({
          error: 'Storage limit reached! Under the Free Plan, you can save up to 10 projects. Please upgrade your subscription to Pro or Team for unlimited storage!',
          limitType: 'SAVE_LIMIT'
        });
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const todayCount = projects.filter(p => p.user_id === userId && p.created_at.startsWith(todayStr)).length;
      if (todayCount >= 5) {
        res.status(403).json({
          error: 'Daily generation limit reached! Under the Free Plan, you can create up to 5 projects per day. Please upgrade your subscription to Pro or Team for unlimited generations!',
          limitType: 'DAILY_LIMIT'
        });
        return;
      }
    }

    if (project) {
      project.title = title;
      project.description = description || '';
      if (workspace_id && accessibleWorkspaceIds.includes(workspace_id)) {
        project.workspace_id = workspace_id;
      } else if (!workspace_id) {
        delete project.workspace_id;
      }
      // Also update output
      const outIdx = outputs.findIndex(o => o.project_id === project!.id);
      if (outIdx !== -1) {
        outputs[outIdx].output_data = JSON.stringify(output_data);
      } else {
        outputs.push({
          id: crypto.randomUUID(),
          project_id: project.id,
          output_data: JSON.stringify(output_data)
        });
      }

      if (project.workspace_id) {
        logWorkspaceAction(project.workspace_id, userId, userEmail, 'PROJECT_EDIT', `Project "${title}" was updated.`);
      }
    } else {
      // Create new
      const newProjectId = crypto.randomUUID();
      project = {
        id: newProjectId,
        user_id: userId,
        title,
        description: description || '',
        created_at: new Date().toISOString()
      };
      if (workspace_id && accessibleWorkspaceIds.includes(workspace_id)) {
        project.workspace_id = workspace_id;
      }
      projects.push(project);
      
      outputs.push({
        id: crypto.randomUUID(),
        project_id: newProjectId,
        output_data: JSON.stringify(output_data)
      });

      if (project.workspace_id) {
        logWorkspaceAction(project.workspace_id, userId, userEmail, 'PROJECT_CREATE', `Project "${title}" was created.`);
      }
    }

    saveProjects();
    saveOutputs();
    const outRecord = outputs.find(o => o.project_id === project!.id);
    if (outRecord) {
      persistRecordToFirestore('project_outputs', outRecord);
    }
    persistRecordToFirestore('projects', project!);

    res.status(201).json({
      status: 'success',
      message: 'Project and outputs successfully persisted to database!',
      project,
      output: {
        project_id: project.id,
        output_data
      }
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Saving project failed.' });
  }
});

// B. List Projects for active user (including collaborative projects from workspaces)
router.get('/list', requireSession, (req: any, res) => {
  try {
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    const userWorkspaceIds = workspaces
      .filter(w => w.owner_id === userId || w.members.map(m => m.toLowerCase().trim()).includes(userEmail))
      .map(w => w.id);

    const userProjects = projects.filter(p => p.user_id === userId || (p.workspace_id && userWorkspaceIds.includes(p.workspace_id)));
    res.json({ projects: userProjects });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed retrieving projects.' });
  }
});

// C. Get detailed project payload (Outputs)
router.get('/load/:projectId', requireSession, (req: any, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    const accessibleWorkspaceIds = workspaces
      .filter(w => w.owner_id === userId || w.members.map(m => m.toLowerCase().trim()).includes(userEmail))
      .map(w => w.id);

    const project = projects.find(p => p.id === projectId && (p.user_id === userId || (p.workspace_id && accessibleWorkspaceIds.includes(p.workspace_id))));
    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied.' });
      return;
    }

    const output = outputs.find(o => o.project_id === projectId);
    res.json({
      project,
      output: output ? JSON.parse(output.output_data) : null
    });

  } catch (err: any) {
    res.status(500).json({ error: 'Authentication failed while mapping project outputs.' });
  }
});

// D. Delete Project
router.delete('/:projectId', requireSession, (req: any, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    const accessibleWorkspaceIds = workspaces
      .filter(w => w.owner_id === userId || w.members.map(m => m.toLowerCase().trim()).includes(userEmail))
      .map(w => w.id);

    const projIdx = projects.findIndex(p => p.id === projectId && (p.user_id === userId || (p.workspace_id && accessibleWorkspaceIds.includes(p.workspace_id))));
    if (projIdx === -1) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const activeProj = projects[projIdx];
    if (activeProj.workspace_id) {
      logWorkspaceAction(activeProj.workspace_id, userId, userEmail, 'PROJECT_DELETE', `Project "${activeProj.title}" was deleted.`);
    }

    projects.splice(projIdx, 1);
    
    const outIdx = outputs.findIndex(o => o.project_id === projectId);
    const outRecord = outIdx !== -1 ? outputs[outIdx] : null;
    if (outIdx !== -1) {
      outputs.splice(outIdx, 1);
    }

    saveProjects();
    saveOutputs();
    deleteRecordFromFirestore('projects', projectId);
    if (outRecord) {
      deleteRecordFromFirestore('project_outputs', outRecord.id);
    }

    res.json({ status: 'deleted', message: 'Project removed successfully.' });

  } catch (err: any) {
    res.status(500).json({ error: 'Failed deleting project.' });
  }
});

// ==========================================
// WORKSPACE MANAGEMENT ROUTES (TEAM PLAN)
// ==========================================

// 1. Get/list accessible workspaces + auto-provision a team workspace for and owned by Team Plan users
router.get('/workspaces/my', requireSession, (req: any, res) => {
  try {
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';
    const userPlan = getUserPlan(userId);

    let userWorkspaces = workspaces.filter(w => w.owner_id === userId || w.members.map(m => m.toLowerCase().trim()).includes(userEmail));

    // Auto-create workspace if they're on Team plan and don't own one yet
    if (userPlan === 'team' && !userWorkspaces.some(w => w.owner_id === userId)) {
      const newWsName = `${req.session.email.split('@')[0].toUpperCase()}'s System Workspace`;
      const newWs: WorkspaceRecord = {
        id: crypto.randomUUID(),
        name: newWsName,
        owner_id: userId,
        members: [],
        created_at: new Date().toISOString()
      };
      workspaces.push(newWs);
      saveWorkspaces();
      persistRecordToFirestore('workspaces', newWs);
      logWorkspaceAction(newWs.id, userId, userEmail, 'CREATE', 'Workspace initialized automatically for Team plan account.');
      userWorkspaces.push(newWs);
    }

    res.json({ workspaces: userWorkspaces });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch collaborative workspace instances.' });
  }
});

// 2. Rename Workspace
router.post('/workspaces/update-name', requireSession, (req: any, res) => {
  try {
    const { workspaceId, name } = req.body;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Workspace name is required.' });
      return;
    }

    const ws = workspaces.find(w => w.id === workspaceId && w.owner_id === userId);
    if (!ws) {
      res.status(444).json({ error: 'Workspace not found or unauthorized modification.' });
      return;
    }

    const oldName = ws.name;
    ws.name = name.trim();
    saveWorkspaces();
    persistRecordToFirestore('workspaces', ws);
    logWorkspaceAction(ws.id, userId, userEmail, 'RENAME', `Renamed workspace from "${oldName}" to "${name}"`);

    res.json({ status: 'success', workspace: ws });
  } catch (err: any) {
    res.status(500).json({ error: 'Error on updating workspace name.' });
  }
});

// 3. Invite member via email
router.post('/workspaces/invite', requireSession, (req: any, res) => {
  try {
    const { workspaceId, email } = req.body;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    if (!email || !email.trim()) {
      res.status(400).json({ error: 'E-mail address is required.' });
      return;
    }

    const ws = workspaces.find(w => w.id === workspaceId && w.owner_id === userId);
    if (!ws) {
      res.status(444).json({ error: 'Workspace index not found or unauthorized.' });
      return;
    }

    const normEmail = email.toLowerCase().trim();
    if (normEmail === userEmail) {
      res.status(400).json({ error: 'You are already the owner of this workspace!' });
      return;
    }

    if (ws.members.map(m => m.toLowerCase().trim()).includes(normEmail)) {
      res.status(400).json({ error: 'This user is already a member of your workspace.' });
      return;
    }

    // Verify if email matches any existing account in user-db.json to show realistic feedback
    const usersFile = path.join(process.cwd(), 'users-db.json');
    let userExists = false;
    let userName = '';
    if (fs.existsSync(usersFile)) {
      const appUsers = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      const foundUser = appUsers.find((u: any) => u.email.toLowerCase().trim() === normEmail);
      userExists = !!foundUser;
      if (foundUser) userName = foundUser.name || foundUser.email.split('@')[0];
    }

    ws.members.push(normEmail);
    saveWorkspaces();
    persistRecordToFirestore('workspaces', ws);
    logWorkspaceAction(ws.id, userId, userEmail, 'MEMBER_ADD', `Invited user ${normEmail}.`);

    res.json({
      status: 'success',
      message: `${normEmail} invited successfully. Account mapping status: ${userExists ? `Registered as ${userName}` : 'Pending registration/offline invite'}.`,
      workspace: ws
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Workspace member invitation failed.' });
  }
});

// 4. Remove member
router.post('/workspaces/remove-member', requireSession, (req: any, res) => {
  try {
    const { workspaceId, email } = req.body;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    const ws = workspaces.find(w => w.id === workspaceId && w.owner_id === userId);
    if (!ws) {
      res.status(444).json({ error: 'Workspace not found or unauthorized.' });
      return;
    }

    const normEmail = email.toLowerCase().trim();
    const idx = ws.members.findIndex(m => m.toLowerCase().trim() === normEmail);
    if (idx === -1) {
      res.status(404).json({ error: 'User is not a member of this workspace.' });
      return;
    }

    ws.members.splice(idx, 1);
    saveWorkspaces();
    persistRecordToFirestore('workspaces', ws);
    logWorkspaceAction(ws.id, userId, userEmail, 'MEMBER_REMOVE', `Removed user ${normEmail} from workspace.`);

    res.json({
      status: 'success',
      message: `${normEmail} removed successfully.`,
      workspace: ws
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// 5. Audit logs retrieval
router.get('/workspaces/audit-logs/:workspaceId', requireSession, (req: any, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.session.userId;
    const userEmail = req.session.email ? req.session.email.toLowerCase().trim() : '';

    const ws = workspaces.find(w => w.id === workspaceId && (w.owner_id === userId || w.members.map(m => m.toLowerCase().trim()).includes(userEmail)));
    if (!ws) {
      res.status(444).json({ error: 'Workspace not found or unauthorized access to audit trail.' });
      return;
    }

    const logs = auditLogs.filter(l => l.workspace_id === workspaceId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit log trail.' });
  }
});

export { router as projectRouter };
