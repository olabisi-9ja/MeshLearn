/**
 * Local Virtual SQLite Database Storage System
 * Implements full message schema persistence, user accounts, and study groups.
 * Provides live SQL command logs so users can observe real transaction queries in offline mode.
 */

export interface SQLiteUser {
  id: string;
  username: string;
  badge: string; // e.g. "S", "Y", "A"
  phone_or_node: string;
  avatar_color: string;
  created_at: string;
  email?: string;
  password?: string;
  academic_unit?: string;
}

export interface SQLiteGroup {
  id: string;
  name: string;
  description: string;
  icon: string; // e.g. "MessageSquare", "Users", "Layers"
  peer_count: number;
  created_by: string;
  created_at: string;
  is_custom?: boolean;
}

export interface SQLiteMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  avatar: string;
  text?: string;
  voice_url?: string;
  duration_sec?: number;
  timestamp: string;
  is_self: number; // SQLite uses 0 or 1 for booleans
  status: 'sent' | 'delivered' | 'read';
}

export interface SQLLogEntry {
  id: string;
  timestamp: string;
  statement: string;
  affected_rows: number;
  status: 'success' | 'warning';
}

const STORAGE_KEYS = {
  USERS: 'sqlite_user_profiles',
  GROUPS: 'sqlite_groups',
  MESSAGES: 'sqlite_messages',
  CURRENT_USER_ID: 'sqlite_active_user_id',
  SQL_LOGS: 'sqlite_transaction_logs',
};

// Default bootstrap database records
const BOOTSTRAP_USERS: SQLiteUser[] = [
  { id: 'u-self', username: 'Alex Johnson', badge: 'AJ', phone_or_node: 'LMS-9021', avatar_color: '#0ea5e9', created_at: '2026-05-31 10:00:00', email: 'alex.j@university.edu', password: 'password123', academic_unit: 'CS & Engineering Dept' },
  { id: 'p-112', username: "Sarah Miller", badge: 'SM', phone_or_node: 'LMS-4112', avatar_color: '#ec4899', created_at: '2026-05-31 10:05:00', email: 'sarah.m@university.edu', password: 'password456', academic_unit: 'Pre-Med Division' },
  { id: 'p-node-entry', username: "Alexander Smart", badge: 'AS', phone_or_node: 'LMS-8304', avatar_color: '#6366f1', created_at: '2026-05-31 10:06:00', email: 'alex.s@university.edu', password: 'password789', academic_unit: 'Mathematics Division' },
  { id: 'p-beta', username: "Liam Davis", badge: 'LD', phone_or_node: 'LMS-5088', avatar_color: '#10b981', created_at: '2026-05-31 10:08:00', email: 'liam.d@university.edu', password: 'password321', academic_unit: 'Distributed Systems Unit' },
];

const BOOTSTRAP_GROUPS: SQLiteGroup[] = [
  {
    id: 'g-classroom',
    name: 'Classroom Group Chat',
    description: 'General study chat for everyone currently sitting in the exam hall or lecture theater.',
    icon: 'Radio',
    peer_count: 5,
    created_by: 'system',
    created_at: '2026-05-31 10:00:00'
  },
  {
    id: 'g-calculus',
    name: 'Calculus 101 Study Group',
    description: 'Dedicated team solving limits, derivatives, integrals, and prep guides for the final.',
    icon: 'BookOpen',
    peer_count: 3,
    created_by: 'u-self',
    created_at: '2026-05-31 10:10:00'
  },
  {
    id: 'g-distributed',
    name: 'Distributed Systems Study',
    description: 'A quiet offline ring sharing consensus and logical clocks notes without cellular plans.',
    icon: 'Network',
    peer_count: 4,
    created_by: 'p-node-entry',
    created_at: '2026-05-31 10:15:00'
  }
];

const BOOTSTRAP_MESSAGES: SQLiteMessage[] = [
  {
    id: 'm1',
    group_id: 'g-classroom',
    sender_id: 'p-112',
    sender_name: "Sarah's iPhone",
    avatar: 'S',
    text: "Hey everyone! Does anyone have the Calculus 101 Study Guide? Our midterm is tomorrow morning and I am missing chapters 3 and 4 😭",
    timestamp: '10:14 AM',
    is_self: 0,
    status: 'read'
  },
  {
    id: 'm2',
    group_id: 'g-classroom',
    sender_id: 'p-node-entry',
    sender_name: "Alexander's iPad",
    avatar: 'A',
    text: "I do! I just downloaded the synced PDF packet. I am seeding/sharing it on the Popular Files list right now. You can get it instantly inside the 'Discover Nearby' menu!",
    timestamp: '10:15 AM',
    is_self: 0,
    status: 'read'
  },
  {
    id: 'm3',
    group_id: 'g-classroom',
    sender_id: 'p-112',
    sender_name: "Sarah's iPhone",
    avatar: 'S',
    text: "Oh amazing! Downloading it now. Peer-to-peer sync is so fast, got it in like 2 seconds!",
    timestamp: '10:16 AM',
    is_self: 0,
    status: 'read'
  },
  {
    id: 'm4',
    group_id: 'g-classroom',
    sender_id: 'u-self',
    sender_name: 'You',
    avatar: 'Y',
    text: 'Is there any lecture audio we should study too?',
    timestamp: '10:18 AM',
    is_self: 1,
    status: 'read'
  },
  {
    id: 'm5',
    group_id: 'g-classroom',
    sender_id: 'p-node-entry',
    sender_name: "Alexander's iPad",
    avatar: 'A',
    voice_url: 'mock-voice-1',
    duration_sec: 8,
    timestamp: '10:19 AM',
    is_self: 0,
    status: 'read'
  },
  
  // Calculus group starting chats
  {
    id: 'm-calc-1',
    group_id: 'g-calculus',
    sender_id: 'p-112',
    sender_name: "Sarah's iPhone",
    avatar: 'S',
    text: "Let's list all calculus equations here so we can reference them offline.",
    timestamp: '10:20 AM',
    is_self: 0,
    status: 'read'
  },
  {
    id: 'm-calc-2',
    group_id: 'g-calculus',
    sender_id: 'u-self',
    sender_name: 'You',
    avatar: 'Y',
    text: "Derivative of e^x is still e^x! Don't forget chain rule guys.",
    timestamp: '10:22 AM',
    is_self: 1,
    status: 'read'
  }
];

export class SQLiteEngine {
  private static logTransaction(statement: string, rowsAffected: number = 0, status: 'success' | 'warning' = 'success') {
    const logs = this.getLogs();
    const newLog: SQLLogEntry = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      statement,
      affected_rows: rowsAffected,
      status,
    };
    const updated = [newLog, ...logs].slice(0, 100); // keep last 100
    localStorage.setItem(STORAGE_KEYS.SQL_LOGS, JSON.stringify(updated));

    // Also trigger custom event so UI components can update instantly
    window.dispatchEvent(new CustomEvent('sqlite_query_log_updated'));
  }

  static getLogs(): SQLLogEntry[] {
    const logsStr = localStorage.getItem(STORAGE_KEYS.SQL_LOGS);
    if (!logsStr) return [];
    try {
      return JSON.parse(logsStr);
    } catch {
      return [];
    }
  }

  static clearLogs() {
    localStorage.setItem(STORAGE_KEYS.SQL_LOGS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('sqlite_query_log_updated'));
  }

  static bootstrap() {
    this.logTransaction("PRAGMA foreign_keys = ON;", 1);
    
    // Create Users table
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(BOOTSTRAP_USERS));
      this.logTransaction("CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, badge TEXT, phone_or_node TEXT UNIQUE, avatar_color TEXT, created_at TEXT, email TEXT, password TEXT, academic_unit TEXT);", BOOTSTRAP_USERS.length);
    }

    // Create Groups table
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(BOOTSTRAP_GROUPS));
      this.logTransaction("CREATE TABLE groups (id TEXT PRIMARY KEY, name TEXT, description TEXT, icon TEXT, peer_count INT, created_by TEXT, created_at TEXT);", BOOTSTRAP_GROUPS.length);
    }

    // Create Messages table
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(BOOTSTRAP_MESSAGES));
      this.logTransaction("CREATE TABLE messages (id TEXT PRIMARY KEY, group_id TEXT, sender_id TEXT, sender_name TEXT, avatar TEXT, text TEXT, voice_url TEXT, duration_sec INT, timestamp TEXT, is_self INT, status TEXT, FOREIGN KEY(group_id) REFERENCES groups(id));", BOOTSTRAP_MESSAGES.length);
    }

    // Active User session is not set by default so the user can register/log in normally on download
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      // Start as empty/null session
    }
  }

  // --- REPOS ---
  
  static queryUsers(): SQLiteUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS) || '[]';
    this.logTransaction("SELECT * FROM users ORDER BY created_at ASC;");
    return JSON.parse(data);
  }

  static registerUser(
    username: string, 
    phoneOrNode: string, 
    badgeLetter: string, 
    avatarColor: string, 
    email?: string, 
    password?: string, 
    academicUnit?: string
  ): SQLiteUser {
    const users = this.queryUsers();
    
    // Check if user exists
    const existing = users.find(u => (email && u.email === email) || u.phone_or_node === phoneOrNode || u.username === username);
    if (existing) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existing.id);
      this.logTransaction(`SELECT * FROM users WHERE email = '${email || ''}' OR username = '${username}' LIMIT 1;`, 1);
      return existing;
    }

    const newUser: SQLiteUser = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      username,
      badge: badgeLetter.substring(0, 2).toUpperCase(),
      phone_or_node: phoneOrNode || 'LMS-' + Math.floor(Math.random() * 8999 + 1000),
      avatar_color: avatarColor,
      created_at: new Date().toISOString().replace('T', ' ').substr(0, 19),
      email,
      password,
      academic_unit: academicUnit || 'Computer Science'
    };

    const updated = [...users, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    this.logTransaction(
      `INSERT INTO users (id, username, badge, phone_or_node, avatar_color, created_at, email, password, academic_unit) VALUES ('${newUser.id}', '${newUser.username}', '${newUser.badge}', '${newUser.phone_or_node}', '${newUser.avatar_color}', '${newUser.created_at}', '${email || ''}', '${password || ''}', '${newUser.academic_unit}');`,
      1
    );

    return newUser;
  }

  static loginUser(email: string, passwordString: string): SQLiteUser | null {
    const users = this.queryUsers();
    const match = users.find(u => u.email?.toLowerCase() === email.toLowerCase() && u.password === passwordString);
    
    if (match) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, match.id);
      this.logTransaction(
        `SELECT * FROM users WHERE email = '${email}' AND password = '***' LIMIT 1;`,
        1
      );
      return match;
    } else {
      this.logTransaction(
        `SELECT * FROM users WHERE email = '${email}' AND password = '***' LIMIT 1; -- 0 ROWS RETURNED`,
        0,
        'warning'
      );
      return null;
    }
  }

  static logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.logTransaction(
      `UPDATE sessions SET active = false; -- User logged out`,
      1
    );
  }

  static getActiveUser(): SQLiteUser | null {
    const activeId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!activeId) return null;
    const users = this.queryUsers();
    const user = users.find(u => u.id === activeId) || null;
    if (user) {
      this.logTransaction(`SELECT * FROM users WHERE id = '${activeId}' LIMIT 1;`);
    }
    return user;
  }

  static getGroups(): SQLiteGroup[] {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]';
    this.logTransaction("SELECT * FROM groups ORDER BY created_at DESC;");
    return JSON.parse(data);
  }

  static createGroup(name: string, description: string, icon: string, createdBy: string = 'u-self'): SQLiteGroup {
    const groups = this.getGroups();
    const newGroup: SQLiteGroup = {
      id: 'g-' + Math.random().toString(36).substr(2, 9),
      name,
      description,
      icon,
      peer_count: 1, // creator is the first member
      created_by: createdBy,
      created_at: new Date().toISOString().replace('T', ' ').substr(0, 19),
      is_custom: true,
    };

    const updated = [newGroup, ...groups];
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updated));

    this.logTransaction(
      `INSERT INTO groups (id, name, description, icon, peer_count, created_by, created_at) VALUES ('${newGroup.id}', '${newGroup.name}', '${newGroup.description}', '${newGroup.icon}', 1, '${newGroup.created_by}', '${newGroup.created_at}');`,
      1
    );

    return newGroup;
  }

  static getMessages(groupId: string): SQLiteMessage[] {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]';
    const allMsgs: SQLiteMessage[] = JSON.parse(data);
    const filtered = allMsgs.filter(m => m.group_id === groupId);
    this.logTransaction(`SELECT * FROM messages WHERE group_id = '${groupId}' ORDER BY timestamp ASC;`, filtered.length);
    return filtered;
  }

  static insertMessage(groupId: string, senderId: string, senderName: string, avatar: string, text?: string, voiceUrl?: string, durationSec?: number): SQLiteMessage {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]';
    const allMsgs: SQLiteMessage[] = JSON.parse(data);

    const activeUser = this.getActiveUser();
    const isSelfLocal = activeUser ? senderId === activeUser.id : senderId === 'u-self';

    const newMsg: SQLiteMessage = {
      id: 'm-' + Math.random().toString(36).substr(2, 9),
      group_id: groupId,
      sender_id: senderId,
      sender_name: senderName,
      avatar,
      text,
      voice_url: voiceUrl,
      duration_sec: durationSec,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_self: isSelfLocal ? 1 : 0,
      status: 'sent',
    };

    allMsgs.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMsgs));

    const voiceMetaString = voiceUrl ? `, voice_url='${voiceUrl}', duration_sec=${durationSec}` : '';
    this.logTransaction(
      `INSERT INTO messages (id, group_id, sender_id, sender_name, avatar, text, timestamp, is_self, status${voiceUrl ? ', voice_url, duration_sec' : ''}) VALUES ('${newMsg.id}', '${groupId}', '${senderId}', '${senderName}', '${avatar}', ${text ? `'${text.replace(/'/g, "''")}'` : 'NULL'}, '${newMsg.timestamp}', ${newMsg.is_self}, 'sent'${voiceUrl ? `, '${voiceUrl}', ${durationSec}` : ''});`,
      1
    );

    return newMsg;
  }

  static updateMessageStatus(messageId: string, status: 'delivered' | 'read') {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]';
    const allMsgs: SQLiteMessage[] = JSON.parse(data);
    const msgIndex = allMsgs.findIndex(m => m.id === messageId);
    
    if (msgIndex !== -1) {
      allMsgs[msgIndex].status = status;
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMsgs));
      this.logTransaction(`UPDATE messages SET status = '${status}' WHERE id = '${messageId}';`, 1);
    }
  }

  static executeCustomSQL(sqlStatement: string): { success: boolean; rowsAffected: number; data?: any[]; error?: string } {
    const cleanSql = sqlStatement.trim().toUpperCase();
    this.logTransaction(sqlStatement, 0, 'success');

    if (cleanSql.startsWith("SELECT * FROM MESSAGES")) {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
      return { success: true, rowsAffected: data.length, data };
    }
    if (cleanSql.startsWith("SELECT * FROM GROUPS")) {
       const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
       return { success: true, rowsAffected: data.length, data };
    }
    if (cleanSql.startsWith("SELECT * FROM USERS")) {
       const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
       return { success: true, rowsAffected: data.length, data };
    }
    if (cleanSql.startsWith("DELETE FROM MESSAGES")) {
       localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
       this.logTransaction("TRUNCATE TABLE messages;", 0, 'warning');
       return { success: true, rowsAffected: 0 };
    }
    
    return { 
      success: false, 
      rowsAffected: 0, 
      error: "Command executed, but read-only custom parsing supported only for 'SELECT * FROM messages', 'SELECT * FROM groups', 'SELECT * FROM users', and 'DELETE FROM messages'." 
    };
  }

  static resetDatabase() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SQL_LOGS);
    this.bootstrap();
    this.logTransaction("VACUUM; -- Database factory reset clean complete", 1);
  }
}
