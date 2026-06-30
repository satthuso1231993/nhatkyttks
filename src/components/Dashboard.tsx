/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Calendar, Clock, BarChart3, Shield, User, FilePieChart } from 'lucide-react';
import { DashboardStats, User as UserType } from '../types.js';

interface DashboardProps {
  currentUser: UserType;
  statsRefreshTrigger: number;
}

export default function Dashboard({ currentUser, statsRefreshTrigger }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'hour' | 'day' | 'month'>('hour');

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [statsRefreshTrigger]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-police-gold border-r-transparent border-police-navy rounded-full animate-spin" />
          <p className="text-xs font-mono">Đang tải báo cáo phân tích...</p>
        </div>
      </div>
    );
  }

  // Color constants for charts
  const COLORS = ['#2563eb', '#38bdf8', '#f59e0b', '#ef4444', '#10b981', '#a855f7'];

  // Select active chart dataset
  const activeChartData = 
    activeChart === 'hour' ? stats.scansByHour :
    activeChart === 'day' ? stats.scansByDay :
    stats.scansByMonth;

  const activeChartLabel = 
    activeChart === 'hour' ? 'Giờ trong ngày' :
    activeChart === 'day' ? 'Ngày gần đây' :
    'Tháng trong năm';

  return (
    <div className="space-y-6">
      
      {/* 1. KEY STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Scans Today */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-md"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lượt quét hôm nay</p>
              <h3 className="text-2xl font-extrabold text-police-gold mt-1 font-mono">{stats.totalScansToday}</h3>
            </div>
            <div className="bg-police-gold/10 p-2 rounded-xl border border-police-gold/20 text-police-gold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Cập nhật realtime</p>
        </motion.div>

        {/* Officers count */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-md"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cán bộ tham gia</p>
              <h3 className="text-2xl font-extrabold text-sky-400 mt-1 font-mono">
                {stats.scansByOfficer.filter(o => o.count > 0).length || 4}
              </h3>
            </div>
            <div className="bg-sky-500/10 p-2 rounded-xl border border-sky-500/20 text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Hoạt động tuần tra</p>
        </motion.div>

        {/* Active teams */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-md"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổ công tác trực</p>
              <h3 className="text-2xl font-extrabold text-police-blue mt-1 font-mono">
                {stats.scansByTeam.filter(t => t.team_name !== 'Cá nhân' && t.count > 0).length || 2}
              </h3>
            </div>
            <div className="bg-police-blue/10 p-2 rounded-xl border border-police-blue/20 text-police-blue">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Chỉ huy kiểm soát</p>
        </motion.div>

        {/* Global total */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-md"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng quét hệ thống</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                {stats.scansByOfficer.reduce((sum, o) => sum + o.count, 0)}
              </h3>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Toàn tỉnh/Thành phố</p>
        </motion.div>

      </div>

      {/* 2. MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Timeline Trends (Line Chart) */}
        <div className="lg:col-span-8 bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-police-gold" /> BIỂU ĐỒ DIỄN BIẾN LƯỢT QUÉT
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">Sự thay đổi lượt quét kiểm tra theo thời gian</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex bg-police-bg p-1 rounded-lg border border-police-navy text-[11px] font-mono">
              <button
                onClick={() => setActiveChart('hour')}
                className={`px-3 py-1 rounded transition-colors ${activeChart === 'hour' ? 'bg-police-blue text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Giờ (Hôm nay)
              </button>
              <button
                onClick={() => setActiveChart('day')}
                className={`px-3 py-1 rounded transition-colors ${activeChart === 'day' ? 'bg-police-blue text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Ngày (7 ngày)
              </button>
              <button
                onClick={() => setActiveChart('month')}
                className={`px-3 py-1 rounded transition-colors ${activeChart === 'month' ? 'bg-police-blue text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                Tháng (Năm nay)
              </button>
            </div>
          </div>

          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e294b" />
                <XAxis 
                  dataKey={activeChart === 'hour' ? 'hour' : activeChart === 'day' ? 'date' : 'month'} 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131b2e', borderColor: '#1e294b', color: '#f3f4f6', borderRadius: '12px', fontSize: '11px' }} 
                  labelStyle={{ fontWeight: 'bold', color: '#f59e0b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Số lượt quét" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4, strokeWidth: 1 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Squad Performance ratio (Pie Chart) */}
        <div className="lg:col-span-4 bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <FilePieChart className="w-4 h-4 text-sky-400" /> TỶ LỆ THEO TỔ CÔNG TÁC
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">Thống kê chia sẻ số lượng đóng góp</p>
          </div>

          <div className="w-full h-[220px] relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.scansByTeam}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="team_name"
                >
                  {stats.scansByTeam.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131b2e', borderColor: '#1e294b', borderRadius: '12px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center absolute statistics */}
            <div className="absolute text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-mono">Tỉ lệ</span>
              <span className="text-xl font-black text-white font-mono">CSGT</span>
            </div>
          </div>

          {/* Custom Custom Legend Grid */}
          <div className="space-y-1.5 text-xs">
            {stats.scansByTeam.slice(0, 4).map((t, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-gray-300 truncate font-medium">{t.team_name}</span>
                </div>
                <span className="font-mono font-bold text-gray-400 ml-2">{t.count} lượt</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. PERFORMANCE STATS: SQUAD VS OFFICER (Bar Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Scans by Officer (Cột) */}
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-lg">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-police-accent" /> HIỆU SUẤT THEO CÁN BỘ
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">Số lượng biển số kiểm tra của mỗi cán bộ tuần tra</p>
          </div>

          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scansByOfficer.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e294b" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis dataKey="officer_name" type="category" stroke="#64748b" width={95} tick={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131b2e', borderColor: '#1e294b', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Số lượt quét" fill="#38bdf8" radius={[0, 4, 4, 0]}>
                  {stats.scansByOfficer.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scans by Patrol Team (Cột) */}
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-5 shadow-lg">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> HIỆU SUẤT THEO TỔ CÔNG TÁC
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">Sản lượng kiểm tra biển số được chia theo chiến dịch và đội tuần tra</p>
          </div>

          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scansByTeam} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e294b" />
                <XAxis dataKey="team_name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#131b2e', borderColor: '#1e294b', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Số lượt quét" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25}>
                  {stats.scansByTeam.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
