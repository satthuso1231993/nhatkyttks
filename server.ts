/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import * as path from 'path';
import { getDbRuntimeInfo, LocalDB } from './src/server/db.js';
import { Scan, Team } from './src/types.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isVercelRuntime = process.env.VERCEL === '1';
let appReadyPromise: Promise<void> | null = null;

// Setup JSON parsers with high limits to handle base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// API ENDPOINTS
// ==========================================

// --- Auth Endpoints ---
app.get('/api/debug/runtime', async (_req, res) => {
  try {
    const runtime = getDbRuntimeInfo();
    const users = await LocalDB.getUsers();
    res.json({
      runtime,
      usersCount: users.length,
      firstUserId: users[0]?.id || null,
      firstUsername: users[0]?.username || null,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tài khoản và mật khẩu.' });
    return;
  }

  const user = await LocalDB.getUserByUsername(username);
  // Easy/transparent pass for prototype - matches username with basic check
  if (!user || password !== `${username}123`) {
    res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    return;
  }

  await LocalDB.addLog(`Đăng nhập hệ thống (Thiết bị: Web/Mobile PWA)`, user.id);
  res.json({ token: `session-token-${user.id}`, user });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, fullname, rank, position, unit } = req.body;
  if (!username || !fullname || !rank || !position || !unit) {
    res.status(400).json({ error: 'Vui lòng điền đầy đủ các trường thông tin.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const existingUser = await LocalDB.getUserByUsername(cleanUsername);
  if (existingUser) {
    res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống.' });
    return;
  }

  const newUserId = `user-${Date.now()}`;
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanUsername)}`;
  
  const newUser = {
    id: newUserId,
    username: cleanUsername,
    fullname: fullname.trim(),
    rank,
    position,
    unit,
    avatar: avatarUrl,
    role: 'canbo' as const,
    created_at: new Date().toISOString()
  };

  const createdUser = await LocalDB.addUser(newUser);
  await LocalDB.addLog(`Đăng ký tài khoản cán bộ mới: ${fullname} (${rank})`, createdUser.id);

  res.json({ success: true, user: createdUser, token: `session-token-${createdUser.id}` });
});

app.post('/api/auth/logout', async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await LocalDB.addLog('Đăng xuất hệ thống', userId);
  }
  res.json({ success: true });
});

// --- Admin User Management Endpoints ---
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await LocalDB.getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi lấy danh sách người dùng' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  const { username, fullname, rank, position, unit, role } = req.body;
  if (!username || !fullname || !rank || !position || !unit) {
    res.status(400).json({ error: 'Vui lòng điền đầy đủ các trường thông tin.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const existingUser = await LocalDB.getUserByUsername(cleanUsername);
  if (existingUser) {
    res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống.' });
    return;
  }

  const newUserId = `user-${Date.now()}`;
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanUsername)}`;
  
  const newUser = {
    id: newUserId,
    username: cleanUsername,
    fullname: fullname.trim(),
    rank,
    position,
    unit,
    avatar: avatarUrl,
    role: (role || 'canbo'),
    created_at: new Date().toISOString()
  };

  try {
    const createdUser = await LocalDB.addUser(newUser);
    await LocalDB.addLog(`Admin tạo tài khoản mới: ${fullname} (${rank} - Vai trò: ${role || 'Cán bộ'})`, 'system');
    res.json({ success: true, user: createdUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi tạo tài khoản' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.query;

  if (id === adminId) {
    res.status(400).json({ error: 'Không thể tự xóa tài khoản chính mình!' });
    return;
  }

  try {
    const success = await LocalDB.deleteUser(id);
    if (success) {
      await LocalDB.addLog(`Admin xóa tài khoản có ID: ${id}`, adminId as string || 'admin');
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Không tìm thấy tài khoản để xóa.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi xóa tài khoản' });
  }
});

// --- Scans Endpoints ---
app.get('/api/scans', async (req, res) => {
  const { plate_number, start_time, end_time, user_id, team_id, unit, page = '1', limit = '15' } = req.query;
  let scans = await LocalDB.getScans();

  // Filter plate number
  if (plate_number) {
    const cleanSearch = (plate_number as string).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    scans = scans.filter(s => s.plate_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(cleanSearch));
  }

  // Filter user ID
  if (user_id) {
    scans = scans.filter(s => s.user_id === user_id);
  }

  // Filter police unit
  if (unit) {
    scans = scans.filter(s => s.officer_unit?.toLowerCase().includes((unit as string).toLowerCase()));
  }

  // Filter team assignment time windows
  if (team_id) {
    const team = (await LocalDB.getTeams()).find(t => t.id === team_id);
    if (team) {
      const teamMemberIds = (await LocalDB.getTeamMembers(team.id)).map(m => m.user_id);
      scans = scans.filter(s => {
        const isMember = teamMemberIds.includes(s.user_id);
        const scanTime = new Date(s.timestamp).getTime();
        const start = new Date(team.start_time).getTime();
        const end = new Date(team.end_time).getTime();
        return isMember && scanTime >= start && scanTime <= end;
      });
    } else {
      scans = [];
    }
  }

  // Filter time range
  if (start_time) {
    const start = new Date(start_time as string).getTime();
    scans = scans.filter(s => new Date(s.timestamp).getTime() >= start);
  }
  if (end_time) {
    const end = new Date(end_time as string).getTime();
    scans = scans.filter(s => new Date(s.timestamp).getTime() <= end);
  }

  // Sort scans chronological newest first
  scans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Pagination
  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);
  const total = scans.length;
  const paginated = scans.slice((p - 1) * l, p * l);

  res.json({
    scans: paginated,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    }
  });
});

app.post('/api/scans', async (req, res) => {
  const { plate_number, timestamp, latitude, longitude, address, accuracy, speed, heading, confidence, user_id } = req.body;

  if (!plate_number || !user_id) {
    res.status(400).json({ error: 'Thông tin biển số và cán bộ quét không đầy đủ.' });
    return;
  }

  // --- ANTI-DUPLICATION CONSTRAINT (30 seconds) ---
  // "Nếu Cùng biển số, Cùng user, Trong vòng 30 giây -> Không lưu."
  const cleanPlate = plate_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const thirtySecsAgo = Date.now() - 30 * 1000;
  const recentScans = (await LocalDB.getScans()).filter(s => {
    const isSameUser = s.user_id === user_id;
    const isSamePlate = s.plate_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanPlate;
    const isRecent = new Date(s.timestamp).getTime() >= thirtySecsAgo;
    return isSameUser && isSamePlate && isRecent;
  });

  if (recentScans.length > 0) {
    res.status(409).json({
      error: 'Phát hiện biển số trùng lặp trong vòng 30 giây. Bỏ qua ghi nhận để tránh dữ liệu dư thừa.',
      duplicate: true
    });
    return;
  }

  const scan: Scan = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    plate_number: plate_number.toUpperCase(),
    timestamp: timestamp || new Date().toISOString(),
    latitude: parseFloat(latitude) || 21.0285,
    longitude: parseFloat(longitude) || 105.8048,
    address: address || 'Chưa xác định địa chỉ',
    accuracy: parseFloat(accuracy) || 10,
    speed: parseFloat(speed) || 0,
    heading: parseFloat(heading) || 0,
    confidence: parseInt(confidence, 10) || 100,
    user_id,
    created_at: new Date().toISOString()
  };

  await LocalDB.addScan(scan);
  await LocalDB.addLog(`Quét biển số xe: ${scan.plate_number} (Độ chính xác: ${scan.confidence}%)`, user_id);

  res.json({ success: true, scan });
});

app.delete('/api/scans/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Track who deleted
  
  await LocalDB.deleteScan(id);
  if (userId) {
    await LocalDB.addLog(`Xóa bản ghi quét biển số: ${id}`, userId as string);
  }
  res.json({ success: true });
});

// --- Teams / Patrol Task Endpoints ---
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await LocalDB.getTeams();
    const result = await Promise.all(teams.map(async t => {
      const members = await LocalDB.getTeamMembersUsers(t.id);
      return {
        ...t,
        members
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/teams', async (req, res) => {
  const { team_name, start_time, end_time, created_by, members } = req.body;

  if (!team_name || !start_time || !end_time || !created_by || !members || !Array.isArray(members)) {
    res.status(400).json({ error: 'Thông tin tổ công tác không đầy đủ.' });
    return;
  }

  const team: Team = {
    id: `team-${Date.now()}`,
    team_name,
    start_time,
    end_time,
    created_by,
    created_at: new Date().toISOString()
  };

  await LocalDB.addTeam(team, members);
  await LocalDB.addLog(`Thành lập tổ công tác mới: ${team_name}`, created_by);

  res.json({ success: true, team });
});

app.put('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  const { team_name, start_time, end_time, members, userId } = req.body;

  if (!team_name || !start_time || !end_time || !members || !Array.isArray(members)) {
    res.status(400).json({ error: 'Thông tin cập nhật không đầy đủ.' });
    return;
  }

  const updated = await LocalDB.updateTeam(id, team_name, start_time, end_time, members);
  if (!updated) {
    res.status(404).json({ error: 'Không tìm thấy tổ công tác.' });
    return;
  }

  if (userId) {
    await LocalDB.addLog(`Cập nhật thông tin tổ công tác: ${team_name}`, userId);
  }

  res.json({ success: true, team: updated });
});

app.delete('/api/teams/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  const team = (await LocalDB.getTeams()).find(t => t.id === id);
  await LocalDB.deleteTeam(id);

  if (userId && team) {
    await LocalDB.addLog(`Xóa tổ công tác: ${team.team_name}`, userId as string);
  }

  res.json({ success: true });
});

// --- Auto Report Generator for a Patrol Team ---
app.get('/api/teams/:id/report', async (req, res) => {
  const { id } = req.params;
  const team = (await LocalDB.getTeams()).find(t => t.id === id);
  if (!team) {
    res.status(404).json({ error: 'Không tìm thấy tổ công tác.' });
    return;
  }

  const members = await LocalDB.getTeamMembersUsers(team.id);
  const memberUserIds = members.map(m => m.id);

  // Filter scans: user_id belongs to team members, timestamp is in team window range
  const startTime = new Date(team.start_time).getTime();
  const endTime = new Date(team.end_time).getTime();

  let scans = (await LocalDB.getScans()).filter(s => {
    const isMember = memberUserIds.includes(s.user_id);
    const scanTime = new Date(s.timestamp).getTime();
    return isMember && scanTime >= startTime && scanTime <= endTime;
  });

  // Sort: ORDER BY timestamp ASC (as requested!)
  scans.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json({
    team,
    members,
    scans
  });
});

// --- Stats Dashboard Endpoints ---
app.get('/api/stats', async (req, res) => {
  try {
    const scans = await LocalDB.getScans();
    const users = await LocalDB.getUsers();
    const teams = await LocalDB.getTeams();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowTime = tomorrow.getTime();

    // 1. Total Scans Today
    const todayScans = scans.filter(s => {
      const t = new Date(s.timestamp).getTime();
      return t >= todayTime && t < tomorrowTime;
    });

    // 2. Scans by Officer
    const officerMap: { [name: string]: number } = {};
    users.forEach(u => { officerMap[u.fullname] = 0; });
    scans.forEach(s => {
      if (s.officer_name) {
        officerMap[s.officer_name] = (officerMap[s.officer_name] || 0) + 1;
      }
    });
    const scansByOfficer = Object.entries(officerMap).map(([officer_name, count]) => ({
      officer_name,
      count
    })).sort((a, b) => b.count - a.count);

    // 3. Scans by Patrol Team
    const teamMap: { [name: string]: number } = {};
    teams.forEach(t => { teamMap[t.team_name] = 0; });
    teamMap['Cá nhân'] = 0;
    scans.forEach(s => {
      if (s.team_name) {
        teamMap[s.team_name] = (teamMap[s.team_name] || 0) + 1;
      }
    });
    const scansByTeam = Object.entries(teamMap).map(([team_name, count]) => ({
      team_name,
      count
    })).sort((a, b) => b.count - a.count);

    // 4. Scans by Hour (for line/bar charts)
    const hourMap: { [hr: string]: number } = {};
    for (let i = 0; i < 24; i++) {
      const hrStr = `${i.toString().padStart(2, '0')}:00`;
      hourMap[hrStr] = 0;
    }
    // Aggregate from scans today/recent
    todayScans.forEach(s => {
      const dateObj = new Date(s.timestamp);
      const hrStr = `${dateObj.getHours().toString().padStart(2, '0')}:00`;
      hourMap[hrStr] = (hourMap[hrStr] || 0) + 1;
    });
    const scansByHour = Object.entries(hourMap).map(([hour, count]) => ({
      hour,
      count
    }));

    // 5. Scans by Day (last 7 days)
    const dayMap: { [day: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dayMap[dayStr] = 0;
    }
    scans.forEach(s => {
      const sDate = new Date(s.timestamp);
      const dayStr = `${sDate.getDate().toString().padStart(2, '0')}/${(sDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dayMap[dayStr] !== undefined) {
        dayMap[dayStr] += 1;
      }
    });
    const scansByDay = Object.entries(dayMap).map(([date, count]) => ({
      date,
      count
    }));

    // 6. Scans by Month (current year months)
    const monthNames = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
    const monthMap: { [m: string]: number } = {};
    monthNames.forEach(m => { monthMap[m] = 0; });
    
    scans.forEach(s => {
      const sDate = new Date(s.timestamp);
      if (sDate.getFullYear() === today.getFullYear()) {
        const mStr = monthNames[sDate.getMonth()];
        monthMap[mStr] += 1;
      }
    });
    const scansByMonth = Object.entries(monthMap).map(([month, count]) => ({
      month,
      count
    }));

    res.json({
      totalScansToday: todayScans.length,
      scansByOfficer,
      scansByTeam,
      scansByHour,
      scansByDay,
      scansByMonth
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- System Activity Logs Endpoints ---
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await LocalDB.getLogs();
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(logs.slice(0, 100)); // Return top 100 recent
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- OCR Endpoint Deprecated: OCR now runs fully in browser ---
app.post('/api/ocr', async (req, res) => {
  res.status(410).json({
    error: 'OCR đã được chuyển sang chạy cục bộ trên trình duyệt. Endpoint /api/ocr không còn được sử dụng.',
  });
});

// ==========================================
// VITE MIDDLEWARE SETUP
// ==========================================

async function ensureAppReady() {
  if (appReadyPromise) {
    return appReadyPromise;
  }

  appReadyPromise = (async () => {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite development middleware integrated.');
      return;
    }

    if (!isVercelRuntime) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('Serving production static files from dist.');
    }
  })();

  return appReadyPromise;
}

if (!isVercelRuntime) {
  ensureAppReady().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CSGT Plate Scanner app running on http://localhost:${PORT}`);
    });
  });
}

export default async function handler(req: any, res: any) {
  await ensureAppReady();
  return app(req, res);
}
