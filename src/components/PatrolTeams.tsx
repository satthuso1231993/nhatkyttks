/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldAlert, Calendar, Plus, Save, Clock, Trash2, Edit3, 
  FileSpreadsheet, ClipboardCheck, ArrowRight, UserPlus, Printer, AlertCircle 
} from 'lucide-react';
import { User, Team } from '../types.js';

interface PatrolTeamsProps {
  currentUser: User;
  onLogAction: (action: string) => void;
}

interface TeamWithMembers extends Team {
  members: User[];
}

export default function PatrolTeams({ currentUser, onLogAction }: PatrolTeamsProps) {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [officers, setOfficers] = useState<User[]>([]);
  
  // Selected squad report state
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<{
    team: Team;
    members: User[];
    scans: any[];
  } | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [formTeamName, setFormTeamName] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formMembers, setFormMembers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'chihuy';

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        // Pre-select first squad if none active
        if (data.length > 0 && !activeTeamId) {
          handleSelectTeam(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching squads:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch('/api/scans'); // Grab all to filter users, but wait, let's fetch a list of users
      // To get users list, our mock DB stores 4 default users. Let's fetch them from custom server static lists
      // or we can simulate officers grid
      const list = [
        { id: 'user-canbo1', fullname: 'Nguyễn Văn Hùng', rank: 'Đại úy', position: 'Cán bộ Tuần tra', unit: 'Đội CSGT Số 1' },
        { id: 'user-canbo2', fullname: 'Trần Thế Anh', rank: 'Thượng úy', position: 'Cán bộ Tuần tra', unit: 'Đội CSGT Số 1' },
        { id: 'user-chihuy', fullname: 'Lê Hồng Anh', rank: 'Trung tá', position: 'Đội trưởng Đội CSGT', unit: 'Đội CSGT Số 1' }
      ];
      setOfficers(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchOfficers();
  }, []);

  const handleSelectTeam = async (id: string) => {
    setActiveTeamId(id);
    setIsReportLoading(true);
    try {
      const res = await fetch(`/api/teams/${id}/report`);
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReportLoading(false);
    }
  };

  // Re-fetch report if time window changes
  const refreshActiveReport = async () => {
    if (activeTeamId) {
      await handleSelectTeam(activeTeamId);
    }
  };

  const handleToggleMember = (uid: string) => {
    if (formMembers.includes(uid)) {
      setFormMembers(prev => prev.filter(id => id !== uid));
    } else {
      setFormMembers(prev => [...prev, uid]);
    }
  };

  // Open Form for editing
  const handleOpenEdit = (team: TeamWithMembers) => {
    setEditingTeamId(team.id);
    setFormTeamName(team.team_name);
    
    // Formatting for datetime-local value input (YYYY-MM-DDThh:mm)
    const formatDateTime = (iso: string) => {
      const d = new Date(iso);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormStartTime(formatDateTime(team.start_time));
    setFormEndTime(formatDateTime(team.end_time));
    setFormMembers(team.members.map(m => m.id));
    setShowCreateForm(true);
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn giải tán tổ công tác "${name}" không?`)) return;
    try {
      const res = await fetch(`/api/teams/${id}?userId=${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        onLogAction(`Giải tán tổ công tác: ${name}`);
        if (activeTeamId === id) {
          setActiveTeamId(null);
          setActiveReport(null);
        }
        fetchTeams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formTeamName.trim()) {
      setErrorMessage('Vui lòng nhập tên tổ công tác.');
      return;
    }
    if (!formStartTime || !formEndTime) {
      setErrorMessage('Vui lòng định cấu hình mốc thời gian.');
      return;
    }
    if (new Date(formStartTime) >= new Date(formEndTime)) {
      setErrorMessage('Thời gian bắt đầu phải đứng trước thời gian kết thúc.');
      return;
    }
    if (formMembers.length === 0) {
      setErrorMessage('Chọn ít nhất 1 cán bộ vào tổ tuần tra.');
      return;
    }

    const payload = {
      team_name: formTeamName,
      start_time: new Date(formStartTime).toISOString(),
      end_time: new Date(formEndTime).toISOString(),
      members: formMembers,
      created_by: currentUser.id,
      userId: currentUser.id
    };

    try {
      let res;
      if (editingTeamId) {
        res = await fetch(`/api/teams/${editingTeamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        onLogAction(editingTeamId ? `Chỉnh sửa tổ tuần tra: ${formTeamName}` : `Thành lập tổ công tác: ${formTeamName}`);
        setShowCreateForm(false);
        setEditingTeamId(null);
        setFormTeamName('');
        setFormStartTime('');
        setFormEndTime('');
        setFormMembers([]);
        
        await fetchTeams();
        if (editingTeamId) {
          handleSelectTeam(editingTeamId);
        }
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Lỗi thao tác máy chủ.');
      }
    } catch (err) {
      setErrorMessage('Đường truyền mạng bị gián đoạn.');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: TEAM SELECTOR & BUILDER PANELS */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Permission Header Notification */}
        {!isAuthorized && (
          <div className="bg-amber-950/30 border border-amber-900/60 p-4 rounded-xl text-amber-200 text-xs flex gap-2.5 leading-normal">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Lưu ý quyền hạn:</strong> Tài khoản Cán bộ tuần tra chỉ có thể xem báo cáo của tổ mình trực. Chức năng lập tổ tuần tra mới bị vô hiệu hóa.
            </span>
          </div>
        )}

        {/* Squad Selection List */}
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-police-gold" /> DANH SÁCH TỔ TUẦN TRA
            </h4>
            {isAuthorized && (
              <button
                onClick={() => {
                  setEditingTeamId(null);
                  setFormTeamName('');
                  setFormStartTime('');
                  setFormEndTime('');
                  setFormMembers([]);
                  setShowCreateForm(true);
                }}
                className="bg-police-blue hover:bg-blue-600 transition text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Lập Tổ Mới
              </button>
            )}
          </div>

          <div className="space-y-3">
            {teams.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">Chưa có tổ tuần tra nào được thiết lập.</p>
            ) : (
              teams.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTeam(t.id)}
                  className={`p-3.5 rounded-xl border transition text-left cursor-pointer flex flex-col justify-between gap-2.5 ${
                    activeTeamId === t.id 
                      ? 'bg-police-navy/50 border-police-accent' 
                      : 'bg-police-bg/50 border-police-navy/50 hover:border-police-navy'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs text-white truncate leading-snug">{t.team_name}</span>
                    {isAuthorized && (
                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 hover:bg-police-navy rounded text-gray-400 hover:text-white transition"
                          title="Chỉnh sửa tổ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(t.id, t.team_name)}
                          className="p-1 hover:bg-red-950 rounded text-gray-400 hover:text-police-red transition"
                          title="Giải tán tổ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 space-y-1 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-police-gold" />
                      <span>Bắt đầu: {new Date(t.start_time).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-police-red" />
                      <span>Kết thúc: {new Date(t.end_time).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  {/* Badges of Members */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.members.map(m => (
                      <span key={m.id} className="text-[9px] font-medium bg-police-navy text-sky-300 px-1.5 py-0.5 rounded border border-police-navy/80">
                        {m.fullname}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CREATION/EDITING MODAL PANEL */}
        {showCreateForm && isAuthorized && (
          <div className="bg-police-card rounded-2xl border-2 border-police-blue p-5 shadow-2xl space-y-4">
            <h4 className="text-xs font-bold text-police-accent uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> {editingTeamId ? 'CẬP NHẬT TỔ TUẦN TRA' : 'THÀNH LẬP TỔ TUẦN TRA'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-2.5 rounded bg-red-950/50 border border-red-900 text-[11px] text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-police-red shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">TÊN TỔ CÔNG TÁC</label>
                <input
                  type="text"
                  value={formTeamName}
                  onChange={(e) => setFormTeamName(e.target.value)}
                  placeholder="Ví dụ: Tổ Tuần tra Chuyên đề 141"
                  className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-police-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">GIỜ BẮT ĐẦU</label>
                  <input
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-2 text-[10px] font-mono text-white focus:outline-none focus:border-police-blue"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">GIỜ KẾT THÚC</label>
                  <input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-2 text-[10px] font-mono text-white focus:outline-none focus:border-police-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-2">CHỌN CÁN BỘ THAM GIA</label>
                <div className="space-y-2 bg-police-bg p-2.5 rounded-lg border border-police-navy max-h-[140px] overflow-y-auto">
                  {officers.map(o => (
                    <label key={o.id} className="flex items-center gap-2.5 p-1.5 hover:bg-police-navy/40 rounded cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formMembers.includes(o.id)}
                        onChange={() => handleToggleMember(o.id)}
                        className="rounded text-police-blue focus:ring-police-blue border-police-navy bg-police-bg"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-gray-200">{o.fullname}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5">({o.rank} &bull; {o.position})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTeamId(null);
                  }}
                  className="flex-1 bg-police-bg border border-police-navy hover:bg-police-navy/40 text-gray-300 py-2 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-police-blue hover:bg-blue-600 font-bold text-white py-2 rounded-lg transition flex items-center justify-center gap-1 shadow"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: DYNAMIC AUTO-GENERATED SQUAD REPORT */}
      <div className="lg:col-span-8">
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-xl min-h-[400px] flex flex-col justify-between print:border-none print:shadow-none print:p-0">
          
          {/* Active Report Header */}
          <div className="border-b border-police-navy/40 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-police-accent uppercase tracking-wider">Mô-đun Tổng hợp báo cáo tự động</span>
              <h3 className="text-sm font-bold text-white uppercase mt-0.5 flex items-center gap-2 print:text-black">
                <ClipboardCheck className="w-5 h-5 text-police-gold" /> BÁO CÁO KẾT QUẢ TUẦN TRA TỔ CÔNG TÁC
              </h3>
            </div>
            {activeReport && (
              <button
                onClick={handlePrintReport}
                className="bg-police-navy hover:bg-police-navy/80 text-police-accent border border-police-navy/60 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition print:hidden"
              >
                <Printer className="w-3.5 h-3.5" /> In Báo Cáo / Xuất PDF
              </button>
            )}
          </div>

          {/* Report Viewer Frame */}
          {isReportLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-t-police-gold border-r-transparent border-police-navy rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-mono">Đang kết xuất dữ liệu quét biển số...</p>
              </div>
            </div>
          ) : activeReport ? (
            <div className="flex-1 space-y-6 print:text-black">
              
              {/* Squad metadata banner for printing */}
              <div className="bg-police-bg/80 border border-police-navy p-4 rounded-xl space-y-2.5 print:bg-white print:border-black print:p-2">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-police-gold print:text-black uppercase">{activeReport.team.team_name}</h4>
                    <p className="text-xs text-gray-400 print:text-black mt-0.5">Người duyệt lập: Lê Hồng Anh (Đội trưởng)</p>
                  </div>
                  <span className="text-[10px] font-mono bg-police-navy px-2.5 py-1 rounded text-gray-300 print:hidden border border-police-navy/80">
                    Sắp xếp: ORDER BY TIMESTAMP ASC
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2.5 border-t border-police-navy/30 print:border-black print:text-[11px]">
                  <div>
                    <span className="text-gray-400 block print:text-black">CA TRỰC BẮT ĐẦU:</span>
                    <span className="text-gray-200 font-bold print:text-black">{new Date(activeReport.team.start_time).toLocaleString('vi-VN')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block print:text-black">CA TRỰC KẾT THÚC:</span>
                    <span className="text-gray-200 font-bold print:text-black">{new Date(activeReport.team.end_time).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Members of report */}
              <div className="text-xs">
                <span className="text-gray-400 font-bold print:text-black block mb-2">CÁN BỘ ĐẢM NHIỆM:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeReport.members.map((m, index) => (
                    <div key={index} className="bg-police-navy/30 border border-police-navy/50 p-2.5 rounded-lg flex items-center gap-3 print:border-black">
                      <div className="w-8 h-8 rounded-full bg-police-navy text-police-gold border border-police-gold/30 flex items-center justify-center font-bold text-xs">
                        CSGT
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs print:text-black">{m.fullname}</p>
                        <p className="text-[10px] text-gray-400 print:text-black">{m.rank} &bull; {m.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automatic query scan logs list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold print:text-black">BẢN GHI PHÁT HIỆN BIỂN SỐ TRONG CA:</span>
                  <span className="text-xs font-mono font-bold text-police-accent print:text-black">{activeReport.scans.length} lượt phát hiện</span>
                </div>

                {activeReport.scans.length === 0 ? (
                  <div className="p-10 border border-dashed border-police-navy rounded-xl text-center text-gray-500">
                    Không ghi nhận lượt quét nào từ các cán bộ trong ca trực của tổ công tác này.
                  </div>
                ) : (
                  <div className="border border-police-navy rounded-xl overflow-hidden print:border-black">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-police-navy/80 text-gray-300 font-bold uppercase tracking-wider border-b border-police-navy/80 print:bg-gray-200 print:text-black print:border-black text-[10px]">
                          <th className="py-2.5 px-3 font-mono">Thời gian</th>
                          <th className="py-2.5 px-3">Cán bộ quét</th>
                          <th className="py-2.5 px-3">Biển kiểm soát</th>
                          <th className="py-2.5 px-3 hidden sm:table-cell">Vị trí địa lý</th>
                          <th className="py-2.5 px-3 text-right">Độ tin cậy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeReport.scans.map((scan, index) => {
                          const scanTime = new Date(scan.timestamp);
                          const timeStr = `${String(scanTime.getHours()).padStart(2, '0')}:${String(scanTime.getMinutes()).padStart(2, '0')}`;
                          return (
                            <tr key={index} className="border-b border-police-navy/40 hover:bg-police-navy/10 print:border-black print:text-black text-xs">
                              <td className="py-2.5 px-3 font-mono text-police-gold print:text-black font-semibold">{timeStr}</td>
                              <td className="py-2.5 px-3 font-medium text-gray-200 print:text-black">{scan.officer_name}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono bg-white text-gray-900 border border-gray-300 font-bold px-2 py-0.5 rounded shadow-sm text-xs leading-none inline-block">
                                  {scan.plate_number}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-400 print:text-black truncate max-w-[200px] hidden sm:table-cell" title={scan.address}>
                                {scan.address}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                                {scan.confidence}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2.5">
              <ClipboardCheck className="w-12 h-12 text-police-navy animate-pulse" />
              <p className="text-xs">Vui lòng chọn hoặc lập tổ tuần tra ở cột bên trái để truy xuất kết quả báo cáo.</p>
            </div>
          )}

          {/* Footer signature blocker for printing */}
          {activeReport && (
            <div className="hidden print:flex justify-between items-center text-xs mt-12 pt-6 border-t border-dashed border-gray-400 print:text-black">
              <div className="text-center w-1/3">
                <p className="font-bold">Đại diện Tổ công tác</p>
                <p className="text-[10px] text-gray-500 mt-10">(Ký, ghi rõ họ tên)</p>
              </div>
              <div className="text-center w-1/3">
                <p className="font-bold">Người tổng hợp báo cáo</p>
                <p className="text-[10px] text-gray-500 mt-10">{currentUser.fullname}</p>
              </div>
              <div className="text-center w-1/3">
                <p className="font-bold">Thủ trưởng đơn vị duyệt</p>
                <p className="text-[10px] text-gray-500 mt-10">(Ký tên và đóng dấu)</p>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
