/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, BarChart3, ShieldAlert, ClipboardList, LogOut, Shield, 
  MapPin, UserCheck, Smartphone, Settings, Info, Menu, X, CheckSquare, Users
} from 'lucide-react';
import { User } from './types.js';

// Modular components import
import CameraScanner from './components/CameraScanner.tsx';
import Dashboard from './components/Dashboard.tsx';
import PatrolTeams from './components/PatrolTeams.tsx';
import ScansExplorer from './components/ScansExplorer.tsx';
import SystemLogs from './components/SystemLogs.tsx';
import AdminAccounts from './components/AdminAccounts.tsx';

export default function App() {
  // Session authentication state
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard' | 'teams' | 'explorer' | 'logs' | 'admin-accounts'>('scanner');
  
  // Refresh synchronization triggers
  const [statsTrigger, setStatsTrigger] = useState(0);
  const [scansTrigger, setScansTrigger] = useState(0);
  const [logsTrigger, setLogsTrigger] = useState(0);

  // Mobile sidebar drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Login Form input state
  const [username, setUsername] = useState('canbo1'); // Default to officer for instant testing
  const [password, setPassword] = useState('canbo1123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regFullname, setRegFullname] = useState('');
  const [regRank, setRegRank] = useState('Đại úy');
  const [regPosition, setRegPosition] = useState('Cán bộ Tuần tra');
  const [regUnit, setRegUnit] = useState('Đội CSGT Số 1');
  const [regError, setRegError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Local storage restoration
  useEffect(() => {
    const storedToken = localStorage.getItem('csgt_session_token');
    const storedUser = localStorage.getItem('csgt_user');
    if (storedToken && storedUser) {
      setUserToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('csgt_session_token', data.token);
        localStorage.setItem('csgt_user', JSON.stringify(data.user));
        setUserToken(data.token);
        setCurrentUser(data.user);
        
        // Sync logs
        setLogsTrigger(prev => prev + 1);
      } else {
        setLoginError(data.error || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setLoginError('Không thể kết nối máy chủ dịch vụ.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsSubmittingReg(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          fullname: regFullname,
          rank: regRank,
          position: regPosition,
          unit: regUnit
        })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('csgt_session_token', data.token);
        localStorage.setItem('csgt_user', JSON.stringify(data.user));
        setUserToken(data.token);
        setCurrentUser(data.user);
        
        // Sync logs
        setLogsTrigger(prev => prev + 1);
      } else {
        setRegError(data.error || 'Đăng ký thất bại.');
      }
    } catch (err) {
      setRegError('Không thể kết nối máy chủ dịch vụ.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem('csgt_session_token');
    localStorage.removeItem('csgt_user');
    setUserToken(null);
    setCurrentUser(null);
    setActiveTab('scanner');
  };

  const handleLogAction = (actionMessage: string) => {
    // Send action to server logs
    setLogsTrigger(prev => prev + 1);
  };

  const handleScanSuccess = () => {
    // Dynamically refresh dashboards and history listings instantly when camera detects plate!
    setStatsTrigger(prev => prev + 1);
    setScansTrigger(prev => prev + 1);
    setLogsTrigger(prev => prev + 1);
  };

  // Pre-configured login shortcuts for easier iframe previews
  const handleShortcutLogin = (user: string) => {
    setUsername(user);
    setPassword(`${user}123`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { text: 'Admin Chỉ Huy', color: 'bg-red-950 text-red-400 border-red-800' };
      case 'chihuy':
        return { text: 'Chỉ Huy Đội', color: 'bg-amber-950 text-amber-400 border-amber-800' };
      default:
        return { text: 'Cán Bộ Tuần Tra', color: 'bg-sky-950 text-sky-400 border-sky-800' };
    }
  };

  return (
    <div className="min-h-screen bg-police-bg text-gray-200 flex flex-col justify-between">
      
      {/* 1. LOGIN / REGISTER SCREEN PORTAL */}
      {!userToken || !currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          
          {/* Subtle decorative background circles */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-police-blue/5 blur-[120px] -top-32 -left-32 pointer-events-none" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-police-gold/5 blur-[120px] -bottom-32 -right-32 pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-police-card rounded-2xl border border-police-navy/80 shadow-2xl p-6 sm:p-8 relative z-10"
          >
            {/* Header Shield Accent */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-police-blue to-police-accent flex items-center justify-center shadow-lg border border-police-accent/30 mb-3 relative">
                <Shield className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-police-gold rounded-full animate-ping" />
              </div>
              <h1 className="font-display font-black text-lg tracking-wide text-white uppercase">CSGT PLATE SCANNER</h1>
              <p className="text-xs text-gray-400 mt-1">Cục Cảnh sát Giao thông - PWA Hệ thống Tuần tra Kiểm soát</p>
            </div>

            {!isRegisterMode ? (
              // LOGIN FORM
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Đăng nhập hệ thống</h2>
                  <button 
                    type="button" 
                    onClick={() => { setIsRegisterMode(true); setLoginError(''); }}
                    className="text-xs text-police-accent hover:underline font-semibold"
                  >
                    Đăng ký tài khoản
                  </button>
                </div>

                {loginError && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-900 text-xs text-red-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-police-red shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Tên Đăng Nhập</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập cán bộ"
                    className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Mật Khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu an ninh"
                    className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-police-blue hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition duration-250 shadow-md flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? 'Đang xác thực an ninh...' : 'ĐĂNG NHẬP HỆ THỐNG'}
                </button>
              </form>
            ) : (
              // REGISTRATION FORM
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Đăng ký cán bộ</h2>
                  <button 
                    type="button" 
                    onClick={() => { setIsRegisterMode(false); setRegError(''); }}
                    className="text-xs text-police-accent hover:underline font-semibold"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>

                {regError && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-900 text-xs text-red-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-police-red shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Tên Đăng Nhập</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="Ví dụ: nguyenvanan"
                    className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                    required
                  />
                  <p className="text-[9px] text-gray-500 mt-1">Mật khẩu đăng nhập mặc định sẽ là: <strong className="text-police-gold">{regUsername || '[tên_đăng_nhập]'}123</strong></p>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Họ và Tên</label>
                  <input
                    type="text"
                    value={regFullname}
                    onChange={(e) => setRegFullname(e.target.value)}
                    placeholder="Nhập họ tên cán bộ đầy đủ"
                    className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Cấp Bậc</label>
                    <select
                      value={regRank}
                      onChange={(e) => setRegRank(e.target.value)}
                      className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                    >
                      <option value="Trung úy">Trung úy</option>
                      <option value="Thượng úy">Thượng úy</option>
                      <option value="Đại úy">Đại úy</option>
                      <option value="Thiếu tá">Thiếu tá</option>
                      <option value="Trung tá">Trung tá</option>
                      <option value="Thượng tá">Thượng tá</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Chức Vụ</label>
                    <select
                      value={regPosition}
                      onChange={(e) => setRegPosition(e.target.value)}
                      className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                    >
                      <option value="Cán bộ Tuần tra">Cán bộ Tuần tra</option>
                      <option value="Tổ trưởng">Tổ trưởng</option>
                      <option value="Phó Đội trưởng">Phó Đội trưởng</option>
                      <option value="Đội trưởng">Đội trưởng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Đơn Vị Công Tác</label>
                  <select
                    value={regUnit}
                    onChange={(e) => setRegUnit(e.target.value)}
                    className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30"
                  >
                    <option value="Đội CSGT Số 1">Đội CSGT Số 1 - Phòng CSGT</option>
                    <option value="Đội CSGT Số 2">Đội CSGT Số 2 - Phòng CSGT</option>
                    <option value="Đội CSGT Số 3">Đội CSGT Số 3 - Phòng CSGT</option>
                    <option value="Đội CSGT Cát Lái">Đội CSGT Cát Lái - Phòng CSGT</option>
                    <option value="Đội CSGT An Sương">Đội CSGT An Sương - Phòng CSGT</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="w-full bg-police-blue hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition duration-250 shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmittingReg ? 'Đang đăng ký cán bộ...' : 'ĐĂNG KÝ HỆ THỐNG'}
                </button>
              </form>
            )}

            {/* Sandbox Credentials Portal Shortcuts */}
            <div className="mt-8 border-t border-police-navy/40 pt-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2.5">Tài khoản trực nghiệm nhanh (Demo)</span>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-gray-300">
                <button
                  type="button"
                  onClick={() => handleShortcutLogin('canbo1')}
                  className={`px-1 py-2 rounded-lg border text-center transition ${username === 'canbo1' ? 'bg-police-blue/20 border-police-accent text-white' : 'bg-police-bg border-police-navy hover:border-police-navy/80'}`}
                >
                  <p className="font-bold">Cán bộ 1</p>
                  <p className="text-[8px] text-gray-400 font-mono mt-0.5">Tuần tra</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcutLogin('chihuy')}
                  className={`px-1 py-2 rounded-lg border text-center transition ${username === 'chihuy' ? 'bg-police-blue/20 border-police-accent text-white' : 'bg-police-bg border-police-navy hover:border-police-navy/80'}`}
                >
                  <p className="font-bold">Chỉ huy</p>
                  <p className="text-[8px] text-gray-400 font-mono mt-0.5">Đội trưởng</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcutLogin('admin')}
                  className={`px-1 py-2 rounded-lg border text-center transition ${username === 'admin' ? 'bg-police-blue/20 border-police-accent text-white' : 'bg-police-bg border-police-navy hover:border-police-navy/80'}`}
                >
                  <p className="font-bold">Trưởng phòng</p>
                  <p className="text-[8px] text-gray-400 font-mono mt-0.5">Admin</p>
                </button>
              </div>
            </div>

            {/* Security Warning notice */}
            <div className="mt-6 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5 leading-normal bg-police-bg/40 p-2.5 rounded-lg border border-police-navy/30">
              <Shield className="w-4.5 h-4.5 text-police-gold shrink-0" />
              <span>Chỉ dành cho lực lượng chức năng làm nhiệm vụ tuần tra giao thông. Hành vi truy cập trái phép bị nghiêm cấm.</span>
            </div>

          </motion.div>
        </div>
      ) : (
        
        // 2. ACTIVE APPLICATION PORTAL
        <div className="flex-1 flex flex-col">
          
          {/* Top Officer bar */}
          <header className="bg-police-card border-b border-police-navy/80 px-4 py-3 sticky top-0 z-40 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              
              {/* App logo & name */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  className="p-1.5 hover:bg-police-navy rounded-lg text-gray-400 hover:text-white transition md:hidden shrink-0"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-police-blue to-police-accent flex items-center justify-center shadow-inner shrink-0">
                  <Shield className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-black text-xs sm:text-sm text-white uppercase tracking-wider leading-none">PLATE SCAN CSGT</h2>
                  <p className="text-[9px] text-gray-400 mt-0.5 font-mono hidden sm:block">PATROL PWA v11.2 &bull; ONLINE STATUS</p>
                </div>
              </div>

              {/* Officer profile badges */}
              <div className="flex items-center gap-3">
                
                {/* Officer card display */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white">{currentUser.fullname}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{currentUser.rank} &bull; {currentUser.unit}</p>
                </div>

                <div className="w-9 h-9 rounded-full bg-police-navy border border-police-accent/30 overflow-hidden shrink-0">
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* Role label badge */}
                <span className={`text-[9px] font-bold px-2 py-1 rounded border hidden md:inline-block ${getRoleBadge(currentUser.role).color}`}>
                  {getRoleBadge(currentUser.role).text}
                </span>

                {/* Logout trigger */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 rounded-lg text-gray-400 hover:text-police-red transition shrink-0"
                  title="Đăng xuất khỏi ca trực"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          </header>

          {/* Master Responsive Navigation tabs */}
          <div className="bg-police-card border-b border-police-navy/40 px-4 print:hidden">
            <div className="max-w-7xl mx-auto flex overflow-x-auto gap-1 py-1 scrollbar-none">
              
              <button
                onClick={() => setActiveTab('scanner')}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-transparent ${activeTab === 'scanner' ? 'bg-police-blue text-white shadow' : 'text-gray-400 hover:text-white hover:bg-police-navy/20'}`}
              >
                <Camera className="w-4 h-4 fill-transparent" /> Camera Quét YOLO
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-transparent ${activeTab === 'dashboard' ? 'bg-police-blue text-white shadow' : 'text-gray-400 hover:text-white hover:bg-police-navy/20'}`}
              >
                <BarChart3 className="w-4 h-4" /> Báo Cáo Phân Tích
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-transparent ${activeTab === 'teams' ? 'bg-police-blue text-white shadow' : 'text-gray-400 hover:text-white hover:bg-police-navy/20'}`}
              >
                <CheckSquare className="w-4 h-4" /> Tổ Công Tác
              </button>

              <button
                onClick={() => setActiveTab('explorer')}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-transparent ${activeTab === 'explorer' ? 'bg-police-blue text-white shadow' : 'text-gray-400 hover:text-white hover:bg-police-navy/20'}`}
              >
                <MapPin className="w-4 h-4" /> Tra Cứu & Bản Đồ
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-transparent ${activeTab === 'logs' ? 'bg-police-blue text-white shadow' : 'text-gray-400 hover:text-white hover:bg-police-navy/20'}`}
              >
                <ClipboardList className="w-4 h-4" /> Nhật Ký Hệ Thống
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin-accounts')}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-transparent ${activeTab === 'admin-accounts' ? 'bg-red-950 border border-red-800 text-red-400 shadow' : 'text-red-400 hover:text-white hover:bg-red-950/20'}`}
                >
                  <Users className="w-4 h-4" /> Quản Lý Tài Khoản
                </button>
              )}

            </div>
          </div>

          {/* Mobile responsive drawer overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 z-50 md:hidden flex justify-start"
              >
                <motion.div
                  initial={{ x: -100 }}
                  animate={{ x: 0 }}
                  exit={{ x: -100 }}
                  onClick={e => e.stopPropagation()}
                  className="w-64 bg-police-card h-full p-5 border-r border-police-navy/80 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-police-navy/40">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-police-blue flex items-center justify-center"><Shield className="w-4.5 h-4.5" /></div>
                        <span className="font-display font-bold text-xs uppercase tracking-wider">CSGT Scanner</span>
                      </div>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4.5 h-4.5" /></button>
                    </div>

                    <nav className="flex flex-col gap-2.5 text-xs font-bold">
                      <button
                        onClick={() => { setActiveTab('scanner'); setIsMobileMenuOpen(false); }}
                        className={`p-3 rounded-lg text-left flex items-center gap-2 ${activeTab === 'scanner' ? 'bg-police-blue text-white' : 'text-gray-400 hover:bg-police-navy/30'}`}
                      >
                        <Camera className="w-4 h-4" /> Camera Quét YOLO
                      </button>
                      <button
                        onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                        className={`p-3 rounded-lg text-left flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-police-blue text-white' : 'text-gray-400 hover:bg-police-navy/30'}`}
                      >
                        <BarChart3 className="w-4 h-4" /> Báo Cáo Phân Tích
                      </button>
                      <button
                        onClick={() => { setActiveTab('teams'); setIsMobileMenuOpen(false); }}
                        className={`p-3 rounded-lg text-left flex items-center gap-2 ${activeTab === 'teams' ? 'bg-police-blue text-white' : 'text-gray-400 hover:bg-police-navy/30'}`}
                      >
                        <CheckSquare className="w-4 h-4" /> Tổ Công Tác
                      </button>
                      <button
                        onClick={() => { setActiveTab('explorer'); setIsMobileMenuOpen(false); }}
                        className={`p-3 rounded-lg text-left flex items-center gap-2 ${activeTab === 'explorer' ? 'bg-police-blue text-white' : 'text-gray-400 hover:bg-police-navy/30'}`}
                      >
                        <MapPin className="w-4 h-4" /> Tra Cứu & Bản Đồ
                      </button>
                      <button
                        onClick={() => { setActiveTab('logs'); setIsMobileMenuOpen(false); }}
                        className={`p-3 rounded-lg text-left flex items-center gap-2 ${activeTab === 'logs' ? 'bg-police-blue text-white' : 'text-gray-400 hover:bg-police-navy/30'}`}
                      >
                        <ClipboardList className="w-4 h-4" /> Nhật Ký Hệ Thống
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => { setActiveTab('admin-accounts'); setIsMobileMenuOpen(false); }}
                          className={`p-3 rounded-lg text-left flex items-center gap-2 ${activeTab === 'admin-accounts' ? 'bg-red-950 border border-red-900/60 text-red-400' : 'text-red-400 hover:bg-red-950/30'}`}
                        >
                          <Users className="w-4 h-4" /> Quản Lý Tài Khoản
                        </button>
                      )}
                    </nav>
                  </div>

                  {/* Profile info in sidebar drawer */}
                  <div className="border-t border-police-navy/40 pt-4 text-xs">
                    <p className="font-bold text-white">{currentUser.fullname}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{currentUser.rank} &bull; {currentUser.unit}</p>
                    <button
                      onClick={handleLogout}
                      className="w-full mt-4 bg-red-950/40 hover:bg-red-950 border border-red-900/60 text-police-red py-2 rounded-lg font-bold text-center flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Đăng Xuất Ca Trực
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. DYNAMIC CONTENT VIEWER STAGE */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'scanner' && (
                  <CameraScanner 
                    currentUser={currentUser} 
                    onScanSuccess={handleScanSuccess} 
                  />
                )}

                {activeTab === 'dashboard' && (
                  <Dashboard 
                    currentUser={currentUser} 
                    statsRefreshTrigger={statsTrigger} 
                  />
                )}

                {activeTab === 'teams' && (
                  <PatrolTeams 
                    currentUser={currentUser} 
                    onLogAction={handleLogAction} 
                  />
                )}

                {activeTab === 'explorer' && (
                  <ScansExplorer 
                    currentUser={currentUser} 
                    refreshTrigger={scansTrigger} 
                    onDeleteSuccess={handleScanSuccess}
                  />
                )}

                {activeTab === 'logs' && (
                  <SystemLogs 
                    logsRefreshTrigger={logsTrigger} 
                  />
                )}

                {activeTab === 'admin-accounts' && currentUser.role === 'admin' && (
                  <AdminAccounts 
                    currentUser={currentUser}
                    onLogAction={handleLogAction}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      )}

      {/* Standard CSGT footer */}
      <footer className="bg-police-card border-t border-police-navy/60 text-[10px] text-gray-500 py-3.5 text-center mt-auto select-none print:hidden">
        <p className="font-mono">BẢN QUYỀN HỆ THỐNG THUỘC CỤC CẢNH SÁT GIAO THÔNG VIỆT NAM &copy; 2026</p>
        <p className="text-[9px] text-gray-600 mt-0.5">Phần mềm hỗ trợ quản lý tuần tra kiểm soát và định danh phương tiện tự động sử dụng AI OCR</p>
      </footer>

    </div>
  );
}
