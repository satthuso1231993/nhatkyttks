/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { User, Team, TeamMember, Scan, SystemLog } from '../types.js';

const DB_FILE = path.join(process.cwd(), 'database.json');

// --- Supabase Client Setup ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  supabaseKey &&
  supabaseKey !== 'your-anon-public-key' &&
  supabaseKey !== 'your-service-role-key'
);

let supabase: any = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('Supabase client initialized successfully on the backend.');
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
} else {
  console.log('Supabase environment variables not configured. Using local JSON database as fallback.');
}

// --- ID Mapping Helpers ---
// To seamlessly bridge local mock IDs ("user-admin", "team-1") with Supabase UUIDs
const idMap: Record<string, string> = {
  'user-admin': '11111111-1111-1111-1111-111111111111',
  'user-chihuy': '22222222-2222-2222-2222-222222222222',
  'user-canbo1': '33333333-3333-3333-3333-333333333333',
  'user-canbo2': '44444444-4444-4444-4444-444444444444',
  'team-1': '55555555-5555-5555-5555-555555555555',
  'team-2': '66666666-6666-6666-6666-666666666666',
};

const reverseIdMap: Record<string, string> = Object.fromEntries(
  Object.entries(idMap).map(([k, v]) => [v, k])
);

function toDbId(id: string): string {
  if (!id) return id;
  if (idMap[id]) return idMap[id];
  // If not a valid UUID format, make a deterministic or random UUID
  if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return '00000000-0000-0000-0000-' + id.padEnd(12, '0').slice(0, 12);
  }
  return id;
}

function fromDbId(id: string): string {
  if (!id) return id;
  return reverseIdMap[id] || id;
}

interface DatabaseSchema {
  users: User[];
  teams: Team[];
  team_members: TeamMember[];
  scans: Scan[];
  logs: SystemLog[];
}

// Initial Seeding Data
const initialUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullname: 'Phạm Minh Chính',
    rank: 'Thượng tá',
    position: 'Trưởng phòng CSGT',
    unit: 'Phòng CSGT Đường bộ - Đường sắt',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'admin'
  },
  {
    id: 'user-chihuy',
    username: 'chihuy',
    fullname: 'Lê Hồng Anh',
    rank: 'Trung tá',
    position: 'Đội trưởng Đội CSGT',
    unit: 'Đội CSGT Số 1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'chihuy'
  },
  {
    id: 'user-canbo1',
    username: 'canbo1',
    fullname: 'Nguyễn Văn Hùng',
    rank: 'Đại úy',
    position: 'Cán bộ Tuần tra',
    unit: 'Đội CSGT Số 1',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150',
    role: 'canbo'
  },
  {
    id: 'user-canbo2',
    username: 'canbo2',
    fullname: 'Trần Thế Anh',
    rank: 'Thượng úy',
    position: 'Cán bộ Tuần tra',
    unit: 'Đội CSGT Số 1',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'canbo'
  }
];

// Helper to generate dates relative to current time
const getDateOffset = (hoursOffset: number): string => {
  const d = new Date();
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
};

const initialTeams: Team[] = [
  {
    id: 'team-1',
    team_name: 'Tổ Tuần tra Chuyên đề 141',
    start_time: getDateOffset(-12),
    end_time: getDateOffset(12),
    created_by: 'user-chihuy',
    created_at: getDateOffset(-12)
  },
  {
    id: 'team-2',
    team_name: 'Tổ Tuần tra Cơ động Số 1',
    start_time: getDateOffset(-48),
    end_time: getDateOffset(-24),
    created_by: 'user-chihuy',
    created_at: getDateOffset(-48)
  }
];

const initialTeamMembers: TeamMember[] = [
  { id: 'tm-1', team_id: 'team-1', user_id: 'user-canbo1' },
  { id: 'tm-2', team_id: 'team-1', user_id: 'user-canbo2' },
  { id: 'tm-3', team_id: 'team-2', user_id: 'user-canbo1' }
];

const initialScans: Scan[] = [
  // Today's scans
  {
    id: 'scan-1',
    plate_number: '29A-123.45',
    timestamp: getDateOffset(-0.5), // 30 mins ago
    latitude: 21.028511,
    longitude: 105.804817,
    address: 'Cầu Giấy, Láng Thượng, Đống Đa, Hà Nội',
    accuracy: 8,
    speed: 34,
    heading: 180,
    confidence: 96,
    user_id: 'user-canbo1',
    created_at: getDateOffset(-0.5)
  },
  {
    id: 'scan-2',
    plate_number: '30H-999.99',
    timestamp: getDateOffset(-1), // 1 hour ago
    latitude: 21.033333,
    longitude: 105.85,
    address: 'Phố Hoàn Kiếm, Tràng Tiền, Hoàn Kiếm, Hà Nội',
    accuracy: 5,
    speed: 12,
    heading: 90,
    confidence: 99,
    user_id: 'user-canbo1',
    created_at: getDateOffset(-1)
  },
  {
    id: 'scan-3',
    plate_number: '51F-567.89',
    timestamp: getDateOffset(-2), // 2 hours ago
    latitude: 21.0064,
    longitude: 105.8427,
    address: 'Đường Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội',
    accuracy: 10,
    speed: 45,
    heading: 270,
    confidence: 93,
    user_id: 'user-canbo2',
    created_at: getDateOffset(-2)
  },
  {
    id: 'scan-4',
    plate_number: '29D1-888.88',
    timestamp: getDateOffset(-4), // 4 hours ago
    latitude: 21.0478,
    longitude: 105.7836,
    address: 'Phạm Văn Đồng, Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội',
    accuracy: 12,
    speed: 60,
    heading: 0,
    confidence: 95,
    user_id: 'user-canbo2',
    created_at: getDateOffset(-4)
  },
  // Scans from yesterday (for charts)
  {
    id: 'scan-5',
    plate_number: '79A-012.34',
    timestamp: getDateOffset(-26), // 26 hours ago
    latitude: 21.0152,
    longitude: 105.7954,
    address: 'Phố Trần Duy Hưng, Trung Hòa, Cầu Giấy, Hà Nội',
    accuracy: 6,
    speed: 0,
    heading: 120,
    confidence: 98,
    user_id: 'user-canbo1',
    created_at: getDateOffset(-26)
  },
  {
    id: 'scan-6',
    plate_number: '43B-008.88',
    timestamp: getDateOffset(-28),
    latitude: 21.0224,
    longitude: 105.8159,
    address: 'Kim Mã, Ba Đình, Hà Nội',
    accuracy: 7,
    speed: 25,
    heading: 210,
    confidence: 92,
    user_id: 'user-canbo1',
    created_at: getDateOffset(-28)
  },
  {
    id: 'scan-7',
    plate_number: '15C-456.78',
    timestamp: getDateOffset(-32),
    latitude: 21.0205,
    longitude: 105.8465,
    address: 'Đại Cồ Việt, Lê Đại Hành, Hai Bà Trưng, Hà Nội',
    accuracy: 15,
    speed: 55,
    heading: 320,
    confidence: 94,
    user_id: 'user-canbo2',
    created_at: getDateOffset(-32)
  }
];

const initialLogs: SystemLog[] = [
  { id: 'log-1', action: 'Hệ thống được khởi tạo', user_id: 'user-admin', created_at: getDateOffset(-48) },
  { id: 'log-2', action: 'Thành lập tổ tuần tra mới: Tổ Tuần tra Cơ động Số 1', user_id: 'user-chihuy', created_at: getDateOffset(-48) },
  { id: 'log-3', action: 'Cán bộ canbo1 đăng nhập vào ca trực', user_id: 'user-canbo1', created_at: getDateOffset(-12) },
  { id: 'log-4', action: 'Thành lập tổ tuần tra mới: Tổ Tuần tra Chuyên đề 141', user_id: 'user-chihuy', created_at: getDateOffset(-12) }
];

export class LocalDB {
  private static load(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const defaultData: DatabaseSchema = {
        users: initialUsers,
        teams: initialTeams,
        team_members: initialTeamMembers,
        scans: initialScans,
        logs: initialLogs
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading database file, returning seeded values', e);
      return {
        users: initialUsers,
        teams: initialTeams,
        team_members: initialTeamMembers,
        scans: initialScans,
        logs: initialLogs
      };
    }
  }

  private static save(data: DatabaseSchema): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // --- Users Table ---
  static async getUsers(): Promise<User[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return (data || []).map((u: any) => ({
          ...u,
          id: fromDbId(u.id)
        }));
      } catch (err) {
        console.warn('Supabase getUsers error, falling back to local:', err);
      }
    }
    return this.load().users;
  }

  static async getUserById(id: string): Promise<User | undefined> {
    if (supabase) {
      try {
        const dbId = toDbId(id);
        const { data, error } = await supabase.from('users').select('*').eq('id', dbId).maybeSingle();
        if (error) throw error;
        if (!data) return undefined;
        return {
          ...data,
          id: fromDbId(data.id)
        };
      } catch (err) {
        console.warn('Supabase getUserById error, falling back to local:', err);
      }
    }
    return this.load().users.find(u => u.id === id);
  }

  static async getUserByUsername(username: string): Promise<User | undefined> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').ilike('username', username).maybeSingle();
        if (error) throw error;
        if (!data) return undefined;
        return {
          ...data,
          id: fromDbId(data.id)
        };
      } catch (err) {
        console.warn('Supabase getUserByUsername error, falling back to local:', err);
      }
    }
    return this.load().users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  static async addUser(user: User): Promise<User> {
    if (supabase) {
      try {
        const dbId = toDbId(user.id || randomUUID());
        const newUser = {
          id: dbId,
          username: user.username,
          fullname: user.fullname,
          rank: user.rank,
          position: user.position,
          unit: user.unit,
          avatar: user.avatar,
          role: user.role,
          created_at: user.created_at || new Date().toISOString()
        };
        const { error } = await supabase.from('users').insert([newUser]);
        if (error) throw error;
        return { ...user, id: fromDbId(dbId) };
      } catch (err) {
        console.warn('Supabase addUser error, falling back to local:', err);
      }
    }

    const db = this.load();
    db.users.push(user);
    this.save(db);
    return user;
  }

  static async deleteUser(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', toDbId(id));
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase deleteUser error, falling back to local:', err);
      }
    }

    const db = this.load();
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    this.save(db);
    return db.users.length < initialLength;
  }

  // --- Teams Table ---
  static async getTeams(): Promise<Team[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('teams').select('*');
        if (error) throw error;
        return (data || []).map((t: any) => ({
          ...t,
          id: fromDbId(t.id),
          created_by: fromDbId(t.created_by)
        }));
      } catch (err) {
        console.warn('Supabase getTeams error, falling back to local:', err);
      }
    }
    return this.load().teams;
  }

  static async addTeam(team: Team, memberUserIds: string[]): Promise<Team> {
    if (supabase) {
      try {
        const dbTeamId = toDbId(team.id || `team-${Date.now()}`);
        const dbCreatedBy = toDbId(team.created_by);
        const newTeam = {
          id: dbTeamId,
          team_name: team.team_name,
          start_time: team.start_time,
          end_time: team.end_time,
          created_by: dbCreatedBy,
          created_at: team.created_at || new Date().toISOString()
        };
        const { error: teamErr } = await supabase.from('teams').insert([newTeam]);
        if (teamErr) throw teamErr;

        if (memberUserIds && memberUserIds.length > 0) {
          const membersToInsert = memberUserIds.map(uid => ({
            id: randomUUID(),
            team_id: dbTeamId,
            user_id: toDbId(uid)
          }));
          const { error: memErr } = await supabase.from('team_members').insert(membersToInsert);
          if (memErr) throw memErr;
        }

        return { ...team, id: fromDbId(dbTeamId) };
      } catch (err) {
        console.warn('Supabase addTeam error, falling back to local:', err);
      }
    }

    const db = this.load();
    db.teams.push(team);
    
    memberUserIds.forEach(uid => {
      db.team_members.push({
        id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        team_id: team.id,
        user_id: uid
      });
    });

    this.save(db);
    return team;
  }

  static async deleteTeam(id: string): Promise<void> {
    if (supabase) {
      try {
        const dbId = toDbId(id);
        await supabase.from('team_members').delete().eq('team_id', dbId);
        const { error } = await supabase.from('teams').delete().eq('id', dbId);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteTeam error, falling back to local:', err);
      }
    }

    const db = this.load();
    db.teams = db.teams.filter(t => t.id !== id);
    db.team_members = db.team_members.filter(tm => tm.team_id !== id);
    this.save(db);
  }

  static async updateTeam(id: string, teamName: string, startTime: string, endTime: string, memberUserIds: string[]): Promise<Team | undefined> {
    if (supabase) {
      try {
        const dbId = toDbId(id);
        const { error: updateErr } = await supabase.from('teams').update({
          team_name: teamName,
          start_time: startTime,
          end_time: endTime
        }).eq('id', dbId);
        if (updateErr) throw updateErr;

        await supabase.from('team_members').delete().eq('team_id', dbId);

        if (memberUserIds && memberUserIds.length > 0) {
          const membersToInsert = memberUserIds.map(uid => ({
            id: randomUUID(),
            team_id: dbId,
            user_id: toDbId(uid)
          }));
          const { error: memErr } = await supabase.from('team_members').insert(membersToInsert);
          if (memErr) throw memErr;
        }

        const { data: updatedTeam, error: fetchErr } = await supabase.from('teams').select('*').eq('id', dbId).maybeSingle();
        if (fetchErr) throw fetchErr;
        if (!updatedTeam) return undefined;
        return {
          ...updatedTeam,
          id: fromDbId(updatedTeam.id),
          created_by: fromDbId(updatedTeam.created_by)
        };
      } catch (err) {
        console.warn('Supabase updateTeam error, falling back to local:', err);
      }
    }

    const db = this.load();
    const teamIndex = db.teams.findIndex(t => t.id === id);
    if (teamIndex === -1) return undefined;

    db.teams[teamIndex].team_name = teamName;
    db.teams[teamIndex].start_time = startTime;
    db.teams[teamIndex].end_time = endTime;

    db.team_members = db.team_members.filter(tm => tm.team_id !== id);
    memberUserIds.forEach(uid => {
      db.team_members.push({
        id: `tm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        team_id: id,
        user_id: uid
      });
    });

    this.save(db);
    return db.teams[teamIndex];
  }

  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    if (supabase) {
      try {
        const dbTeamId = toDbId(teamId);
        const { data, error } = await supabase.from('team_members').select('*').eq('team_id', dbTeamId);
        if (error) throw error;
        return (data || []).map((tm: any) => ({
          id: fromDbId(tm.id),
          team_id: fromDbId(tm.team_id),
          user_id: fromDbId(tm.user_id)
        }));
      } catch (err) {
        console.warn('Supabase getTeamMembers error, falling back to local:', err);
      }
    }
    return this.load().team_members.filter(tm => tm.team_id === teamId);
  }

  static async getTeamMembersUsers(teamId: string): Promise<User[]> {
    if (supabase) {
      try {
        const dbTeamId = toDbId(teamId);
        const { data: members, error: memErr } = await supabase.from('team_members').select('user_id').eq('team_id', dbTeamId);
        if (memErr) throw memErr;
        if (!members || members.length === 0) return [];
        const userIds = members.map((m: any) => m.user_id);
        
        const { data: users, error: userErr } = await supabase.from('users').select('*').in('id', userIds);
        if (userErr) throw userErr;
        return (users || []).map((u: any) => ({
          ...u,
          id: fromDbId(u.id)
        }));
      } catch (err) {
        console.warn('Supabase getTeamMembersUsers error, falling back to local:', err);
      }
    }

    const db = this.load();
    const memberUids = db.team_members.filter(tm => tm.team_id === teamId).map(tm => tm.user_id);
    return db.users.filter(u => memberUids.includes(u.id));
  }

  // --- Scans Table ---
  static async getScans(): Promise<Scan[]> {
    if (supabase) {
      try {
        const { data: scans, error: scanErr } = await supabase.from('scans').select('*');
        if (scanErr) throw scanErr;

        const { data: users, error: userErr } = await supabase.from('users').select('*');
        if (userErr) throw userErr;

        const { data: teams, error: teamErr } = await supabase.from('teams').select('*');
        if (teamErr) throw teamErr;

        const { data: teamMembers, error: memErr } = await supabase.from('team_members').select('*');
        if (memErr) throw memErr;

        const uList = users || [];
        const tList = teams || [];
        const mList = teamMembers || [];

        return (scans || []).map((s: any) => {
          const dbUserId = s.user_id;
          const officer = uList.find((u: any) => u.id === dbUserId);
          const teamMemberRecord = mList.find((tm: any) => tm.user_id === dbUserId);
          
          let team_name = 'Cá nhân';
          if (teamMemberRecord) {
            const team = tList.find((t: any) => {
              if (t.id !== teamMemberRecord.team_id) return false;
              const scanTime = new Date(s.timestamp).getTime();
              const start = new Date(t.start_time).getTime();
              const end = new Date(t.end_time).getTime();
              return scanTime >= start && scanTime <= end;
            });
            if (team) {
              team_name = team.team_name;
            }
          }

          return {
            id: fromDbId(s.id),
            plate_number: s.plate_number,
            timestamp: s.timestamp,
            latitude: s.latitude,
            longitude: s.longitude,
            address: s.address,
            accuracy: s.accuracy,
            speed: s.speed,
            heading: s.heading,
            confidence: s.confidence,
            user_id: fromDbId(s.user_id),
            created_at: s.created_at,
            officer_name: officer?.fullname || 'Không rõ',
            officer_rank: officer?.rank || 'Không rõ',
            officer_unit: officer?.unit || 'Không rõ',
            team_name
          };
        });
      } catch (err) {
        console.warn('Supabase getScans error, falling back to local:', err);
      }
    }

    const db = this.load();
    return db.scans.map(s => {
      const officer = db.users.find(u => u.id === s.user_id);
      const teamMemberRecord = db.team_members.find(tm => tm.user_id === s.user_id);
      let team_name = 'Cá nhân';
      if (teamMemberRecord) {
        const team = db.teams.find(t => {
          if (t.id !== teamMemberRecord.team_id) return false;
          const scanTime = new Date(s.timestamp).getTime();
          const start = new Date(t.start_time).getTime();
          const end = new Date(t.end_time).getTime();
          return scanTime >= start && scanTime <= end;
        });
        if (team) {
          team_name = team.team_name;
        }
      }

      return {
        ...s,
        officer_name: officer?.fullname || 'Không rõ',
        officer_rank: officer?.rank || 'Không rõ',
        officer_unit: officer?.unit || 'Không rõ',
        team_name
      };
    });
  }

  static async addScan(scan: Scan): Promise<Scan> {
    if (supabase) {
      try {
        const dbId = toDbId(scan.id || `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
        const dbUserId = toDbId(scan.user_id);
        const newScan = {
          id: dbId,
          plate_number: scan.plate_number.toUpperCase(),
          timestamp: scan.timestamp || new Date().toISOString(),
          latitude: scan.latitude,
          longitude: scan.longitude,
          address: scan.address,
          accuracy: scan.accuracy,
          speed: scan.speed,
          heading: scan.heading,
          confidence: scan.confidence,
          user_id: dbUserId,
          created_at: scan.created_at || new Date().toISOString()
        };
        const { error } = await supabase.from('scans').insert([newScan]);
        if (error) throw error;
        return { ...scan, id: fromDbId(dbId) };
      } catch (err) {
        console.warn('Supabase addScan error, falling back to local:', err);
      }
    }

    const db = this.load();
    db.scans.push(scan);
    this.save(db);
    return scan;
  }

  static async deleteScan(id: string): Promise<void> {
    if (supabase) {
      try {
        const dbId = toDbId(id);
        const { error } = await supabase.from('scans').delete().eq('id', dbId);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteScan error, falling back to local:', err);
      }
    }

    const db = this.load();
    db.scans = db.scans.filter(s => s.id !== id);
    this.save(db);
  }

  // --- Logs Table ---
  static async getLogs(): Promise<SystemLog[]> {
    if (supabase) {
      try {
        const { data: logs, error: logErr } = await supabase.from('logs').select('*');
        if (logErr) throw logErr;

        const { data: users, error: userErr } = await supabase.from('users').select('*');
        if (userErr) throw userErr;

        const uList = users || [];

        return (logs || []).map((l: any) => {
          const officer = uList.find((u: any) => u.id === l.user_id);
          return {
            id: fromDbId(l.id),
            action: l.action,
            user_id: fromDbId(l.user_id),
            created_at: l.created_at,
            username: officer?.username || 'system',
            fullname: officer?.fullname || 'Hệ thống'
          };
        });
      } catch (err) {
        console.warn('Supabase getLogs error, falling back to local:', err);
      }
    }

    const db = this.load();
    return db.logs.map(l => {
      const u = db.users.find(user => user.id === l.user_id);
      return {
        ...l,
        username: u?.username || 'system',
        fullname: u?.fullname || 'Hệ thống'
      };
    });
  }

  static async addLog(action: string, userId: string): Promise<SystemLog> {
    if (supabase) {
      try {
        const dbId = randomUUID();
        const dbUserId = toDbId(userId);
        const newLog = {
          id: dbId,
          action,
          user_id: dbUserId,
          created_at: new Date().toISOString()
        };
        const { error } = await supabase.from('logs').insert([newLog]);
        if (error) throw error;
        return {
          id: fromDbId(dbId),
          action,
          user_id: userId,
          created_at: newLog.created_at
        };
      } catch (err) {
        console.warn('Supabase addLog error, falling back to local:', err);
      }
    }

    const db = this.load();
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    db.logs.push(log);
    this.save(db);
    return log;
  }
}
