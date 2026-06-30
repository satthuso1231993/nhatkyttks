/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shield, ClipboardList, Clock, User, Filter, RefreshCw } from 'lucide-react';
import { SystemLog } from '../types.js';

interface SystemLogsProps {
  logsRefreshTrigger: number;
}

export default function SystemLogs({ logsRefreshTrigger }: SystemLogsProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'auth' | 'scan' | 'team' | 'delete'>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logsRefreshTrigger]);

  const filteredLogs = logs.filter(l => {
    if (filterType === 'all') return true;
    if (filterType === 'auth') return l.action.toLowerCase().includes('đăng nhập') || l.action.toLowerCase().includes('đăng xuất');
    if (filterType === 'scan') return l.action.toLowerCase().includes('quét biển số');
    if (filterType === 'team') return l.action.toLowerCase().includes('tổ công tác') || l.action.toLowerCase().includes('tổ tuần tra');
    if (filterType === 'delete') return l.action.toLowerCase().includes('xóa') || l.action.toLowerCase().includes('giải tán');
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('đăng nhập')) return 'bg-emerald-950 text-emerald-400 border border-emerald-800/50';
    if (act.includes('đăng xuất')) return 'bg-slate-900 text-slate-400 border border-slate-700/50';
    if (act.includes('quét')) return 'bg-blue-950 text-sky-400 border border-blue-800/50';
    if (act.includes('thành lập') || act.includes('sửa')) return 'bg-amber-950 text-amber-400 border border-amber-800/50';
    if (act.includes('xóa') || act.includes('giải tán')) return 'bg-red-950 text-red-400 border border-red-800/50';
    return 'bg-police-navy text-gray-300 border border-police-navy/80';
  };

  return (
    <div className="bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-xl">
      
      {/* Header and filters toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-police-navy/40 pb-4 mb-4">
        <div>
          <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5 text-police-gold" /> NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Lịch sử kiểm soát an ninh hệ thống và tuần tra</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded text-xs transition font-semibold ${filterType === 'all' ? 'bg-police-blue text-white' : 'bg-police-bg text-gray-400 hover:text-white'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterType('auth')}
            className={`px-2.5 py-1 rounded text-xs transition font-semibold ${filterType === 'auth' ? 'bg-police-blue text-white' : 'bg-police-bg text-gray-400 hover:text-white'}`}
          >
            Đăng nhập/ra
          </button>
          <button
            onClick={() => setFilterType('scan')}
            className={`px-2.5 py-1 rounded text-xs transition font-semibold ${filterType === 'scan' ? 'bg-police-blue text-white' : 'bg-police-bg text-gray-400 hover:text-white'}`}
          >
            Quét xe
          </button>
          <button
            onClick={() => setFilterType('team')}
            className={`px-2.5 py-1 rounded text-xs transition font-semibold ${filterType === 'team' ? 'bg-police-blue text-white' : 'bg-police-bg text-gray-400 hover:text-white'}`}
          >
            Hồ sơ Tổ
          </button>
          <button
            onClick={() => setFilterType('delete')}
            className={`px-2.5 py-1 rounded text-xs transition font-semibold ${filterType === 'delete' ? 'bg-police-blue text-white' : 'bg-police-bg text-gray-400 hover:text-white'}`}
          >
            Sửa / Xóa
          </button>
          <button
            onClick={fetchLogs}
            className="p-1 bg-police-bg text-gray-400 hover:text-white rounded transition"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">
          <div className="w-6 h-6 border-2 border-t-police-gold border-r-transparent border-police-navy rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono">Đang kết xuất nhật ký...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-gray-500 border border-dashed border-police-navy rounded-xl">
          Không tìm thấy hoạt động nào phù hợp trong danh sách.
        </div>
      ) : (
        <div className="border border-police-navy/60 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-police-navy/50 text-gray-300 font-bold border-b border-police-navy/60 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-mono">Mốc Thời gian</th>
                <th className="py-3 px-4">Tài khoản cán bộ</th>
                <th className="py-3 px-4">Hành động ghi nhận</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-police-navy/30 hover:bg-police-navy/10 transition text-xs">
                  <td className="py-3 px-4 font-mono text-gray-400 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-police-gold" />
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-police-bg border border-police-navy text-sky-400 flex items-center justify-center font-bold text-[9px]">
                        CS
                      </div>
                      <div>
                        <p className="font-bold text-gray-200 leading-none">{log.fullname}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">@{log.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-200">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-none mr-2 inline-block ${getActionBadgeColor(log.action)}`}>
                      {log.action.split(':')[0]}
                    </span>
                    <span className="text-xs text-gray-300">{log.action.includes(':') ? log.action.split(':').slice(1).join(':') : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
