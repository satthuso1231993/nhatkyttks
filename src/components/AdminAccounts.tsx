/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, Users, Trash2, Shield, User, AlertTriangle, Check, RefreshCw, Key
} from 'lucide-react';
import { User as UserType, UserRole } from '../types.js';

interface AdminAccountsProps {
  currentUser: UserType;
  onLogAction?: (msg: string) => void;
}

export default function AdminAccounts({ currentUser, onLogAction }: AdminAccountsProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState<UserRole>('canbo');
  const [rank, setRank] = useState('Trung úy');
  const [position, setPosition] = useState('Cán bộ Tuần tra');
  const [unit, setUnit] = useState('Đội CSGT Số 1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Không thể tải danh sách tài khoản');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullname.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin tài khoản!');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          fullname: fullname.trim(),
          rank,
          position,
          unit,
          role
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tạo tài khoản');
      }

      setSuccess(`Tạo tài khoản cán bộ "${fullname}" thành công! Mật khẩu mặc định: ${cleanUsername}123`);
      setUsername('');
      setFullname('');
      setRole('canbo');
      setRank('Trung úy');
      setPosition('Cán bộ Tuần tra');
      setUnit('Đội CSGT Số 1');
      
      if (onLogAction) {
        onLogAction(`Đã tạo tài khoản cho cán bộ ${fullname.trim()}`);
      }
      
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser.id) {
      setError('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của cán bộ "${name}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${id}?adminId=${currentUser.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa tài khoản');

      setSuccess(`Đã xóa thành công tài khoản cán bộ "${name}"`);
      if (onLogAction) {
        onLogAction(`Đã xóa tài khoản cán bộ: ${name}`);
      }
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return { text: 'Admin Chỉ Huy', color: 'bg-red-950/60 text-red-400 border-red-900/60' };
      case 'chihuy':
        return { text: 'Chỉ Huy Đội', color: 'bg-amber-950/60 text-amber-400 border-amber-900/60' };
      default:
        return { text: 'Cán Bộ Tuần Tra', color: 'bg-sky-950/60 text-sky-400 border-sky-900/60' };
    }
  };

  return (
    <div id="admin-accounts-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      
      {/* Left Column: Register Form */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-police-accent" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tạo Tài Khoản Cán Bộ</h3>
              <p className="text-[10px] text-gray-400">Đăng ký thêm tài khoản mới vào cơ sở dữ liệu tuần tra</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900/60 text-police-red p-3 rounded-xl text-xs flex items-start gap-2 mb-4 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 p-3 rounded-xl text-xs flex items-start gap-2 mb-4">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Tên đăng nhập (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="Ví dụ: nguyenvanan"
                className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue focus:ring-1 focus:ring-police-blue/30 font-mono"
                required
              />
              <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
                <Key className="w-3 h-3 text-police-gold" />
                Mật khẩu đăng nhập mặc định: <strong className="text-police-gold">{username || '[tên]'}123</strong>
              </p>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Họ và Tên</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-police-blue"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Cấp Bậc</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-police-blue"
                >
                  <option value="Thiếu úy">Thiếu úy</option>
                  <option value="Trung úy">Trung úy</option>
                  <option value="Thượng úy">Thượng úy</option>
                  <option value="Đại úy">Đại úy</option>
                  <option value="Thiếu tá">Thiếu tá</option>
                  <option value="Trung tá">Trung tá</option>
                  <option value="Thượng tá">Thượng tá</option>
                  <option value="Đại tá">Đại tá</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Vai Trò Hệ Thống</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-police-blue"
                >
                  <option value="canbo">Cán bộ Tuần tra</option>
                  <option value="chihuy">Chỉ huy Đội</option>
                  <option value="admin">Admin Chỉ huy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Chức Vụ</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-police-blue"
                >
                  <option value="Cán bộ Tuần tra">Cán bộ Tuần tra</option>
                  <option value="Tổ trưởng">Tổ trưởng</option>
                  <option value="Phó Đội trưởng">Phó Đội trưởng</option>
                  <option value="Đội trưởng">Đội trưởng</option>
                  <option value="Trưởng phòng">Trưởng phòng</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Đơn Vị Công Tác</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-police-bg border border-police-navy rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-police-blue"
                >
                  <option value="Đội CSGT Số 1">Đội CSGT Số 1</option>
                  <option value="Đội CSGT Số 2">Đội CSGT Số 2</option>
                  <option value="Đội CSGT Số 3">Đội CSGT Số 3</option>
                  <option value="Đội CSGT Cát Lái">Đội CSGT Cát Lái</option>
                  <option value="Đội CSGT An Sương">Đội CSGT An Sương</option>
                  <option value="Phòng CSGT">Phòng CSGT</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-police-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition duration-150 uppercase tracking-wider shadow-md text-xs mt-2"
            >
              {isSubmitting ? 'Đang khởi tạo...' : 'KÍCH HOẠT TÀI KHOẢN'}
            </button>

          </form>
        </div>
      </div>

      {/* Right Column: User list */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-xl flex flex-col h-full">
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-police-gold" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Danh Sách Tài Khoản ({users.length})</h3>
                <p className="text-[10px] text-gray-400">Danh sách các cán bộ, chỉ huy được phân quyền hệ thống</p>
              </div>
            </div>
            
            <button 
              onClick={fetchUsers} 
              disabled={loading}
              className="p-1.5 bg-police-navy/50 hover:bg-police-navy border border-police-navy rounded-lg text-gray-400 hover:text-white transition"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 font-mono text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-police-accent" />
              <span>Đang tải danh sách tài khoản...</span>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[480px] pr-1 space-y-3 scrollbar-thin">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                    user.id === currentUser.id 
                      ? 'bg-police-blue/10 border-police-accent/40 shadow-md' 
                      : 'bg-police-bg/60 border-police-navy/60 hover:border-police-navy'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-police-navy border border-police-navy overflow-hidden shrink-0">
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{user.fullname}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleLabel(user.role).color}`}>
                          {getRoleLabel(user.role).text}
                        </span>
                        {user.id === currentUser.id && (
                          <span className="text-[8px] bg-police-blue text-white font-bold px-1 rounded">BẠN</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        {user.rank} &bull; {user.position} &bull; {user.unit}
                      </p>
                      <p className="text-[9px] text-gray-500 font-mono">Tên đăng nhập: <strong className="text-gray-300">{user.username}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {user.id !== currentUser.id ? (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullname)}
                        className="p-2 bg-red-950/20 hover:bg-red-950/80 text-red-400 hover:text-white rounded-lg border border-transparent hover:border-red-900 transition shrink-0"
                        title="Xóa tài khoản này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic px-2">Cố định</span>
                    )}
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500 italic text-xs">
                  Không tìm thấy tài khoản nào trong hệ thống.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
