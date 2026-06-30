/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Calendar, User, Shield, MapPin, ChevronLeft, ChevronRight, 
  Trash2, FileSpreadsheet, Printer, RefreshCw, Compass, AlertCircle, Eye
} from 'lucide-react';
import { Scan, User as UserType } from '../types.js';

interface ScansExplorerProps {
  currentUser: UserType;
  refreshTrigger: number;
  onDeleteSuccess: () => void;
}

export default function ScansExplorer({ currentUser, refreshTrigger, onDeleteSuccess }: ScansExplorerProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search Filters State
  const [filterPlate, setFilterPlate] = useState('');
  const [filterOfficerId, setFilterOfficerId] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterStartTime, setFilterStartTime] = useState('');
  const [filterEndTime, setFilterEndTime] = useState('');

  // Selected marker on map
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  // Static officers list for filter dropdown
  const [officers, setOfficers] = useState<UserType[]>([]);

  const fetchScans = async (pageNumber = 1) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(pageNumber),
        limit: String(pagination.limit),
        plate_number: filterPlate,
        user_id: filterOfficerId,
        unit: filterUnit,
        start_time: filterStartTime,
        end_time: filterEndTime
      });

      const res = await fetch(`/api/scans?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setScans(data.scans);
        setPagination(data.pagination);

        // Pre-select first scan on map if available
        if (data.scans.length > 0 && !selectedScan) {
          setSelectedScan(data.scans[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const list = [
        { id: 'user-canbo1', fullname: 'Nguyễn Văn Hùng', role: 'canbo' } as UserType,
        { id: 'user-canbo2', fullname: 'Trần Thế Anh', role: 'canbo' } as UserType,
        { id: 'user-chihuy', fullname: 'Lê Hồng Anh', role: 'chihuy' } as UserType
      ];
      setOfficers(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchScans(1);
    fetchOfficers();
  }, [refreshTrigger, filterOfficerId]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchScans(1);
  };

  const handleResetFilters = () => {
    setFilterPlate('');
    setFilterOfficerId('');
    setFilterUnit('');
    setFilterStartTime('');
    setFilterEndTime('');
    setTimeout(() => fetchScans(1), 50);
  };

  const handleDeleteScan = async (id: string, plate: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn bản ghi quét biển kiểm soát ${plate}?`)) return;
    try {
      const res = await fetch(`/api/scans/${id}?userId=${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedScan?.id === id) {
          setSelectedScan(null);
        }
        onDeleteSuccess();
        fetchScans(pagination.page);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // EXPORT TO EXCEL/CSV (Supports full accents in Excel using BOM!)
  const handleExportCSV = () => {
    if (scans.length === 0) {
      alert('Không có dữ liệu để xuất báo cáo.');
      return;
    }

    // Build standard CSV records
    const headers = ['Thời gian', 'Biển số xe', 'Cán bộ quét', 'Cấp bậc', 'Đơn vị', 'Địa chỉ tọa độ', 'Độ chính xác GPS (m)', 'Tốc độ (km/h)', 'Độ tin cậy OCR (%)'];
    const rows = scans.map(s => [
      new Date(s.timestamp).toLocaleString('vi-VN'),
      s.plate_number,
      s.officer_name,
      s.officer_rank,
      s.officer_unit,
      s.address,
      s.accuracy,
      s.speed,
      s.confidence
    ]);

    // CSV structure combining header and rows with tab or comma
    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Add UTF-8 BOM to prevent excel Vietnamese encoding issues!
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BAO_CAO_CSGT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: ADVANCED SEARCH FILTER & PAGINATED LISTING */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Search Panel Container */}
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-xl">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-police-gold" /> BỘ LỌC TRA CỨU BIỂN SỐ
          </h4>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              {/* Plate search */}
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1">BIỂN KIỂM SÁT</label>
                <input
                  type="text"
                  value={filterPlate}
                  onChange={(e) => setFilterPlate(e.target.value)}
                  placeholder="Ví dụ: 30H-999"
                  className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-police-blue uppercase"
                />
              </div>

              {/* Officer search */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">CÁN BỘ THỰC HIỆN</label>
                <select
                  value={filterOfficerId}
                  onChange={(e) => setFilterOfficerId(e.target.value)}
                  className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-police-blue"
                >
                  <option value="">-- Tất cả --</option>
                  {officers.map(o => (
                    <option key={o.id} value={o.id}>{o.fullname}</option>
                  ))}
                </select>
              </div>

              {/* Unit Search */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">ĐƠN VỊ CÔNG TÁC</label>
                <input
                  type="text"
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  placeholder="Ví dụ: Đội CSGT Số 1"
                  className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-police-blue"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Time Window filters */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">TỪ KHUNG GIỜ/NGÀY</label>
                <input
                  type="datetime-local"
                  value={filterStartTime}
                  onChange={(e) => setFilterStartTime(e.target.value)}
                  className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-2 text-[10px] font-mono text-white focus:outline-none focus:border-police-blue"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">ĐẾN KHUNG GIỜ/NGÀY</label>
                <input
                  type="datetime-local"
                  value={filterEndTime}
                  onChange={(e) => setFilterEndTime(e.target.value)}
                  className="w-full bg-police-bg border border-police-navy rounded-lg py-2 px-2 text-[10px] font-mono text-white focus:outline-none focus:border-police-blue"
                />
              </div>
            </div>

            {/* Actions toolbar */}
            <div className="flex justify-between items-center gap-2.5 pt-2 border-t border-police-navy/30">
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-police-navy/40 hover:bg-police-navy/60 border border-police-navy/60 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Xóa Bộ Lọc
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
                </button>
                <button
                  type="submit"
                  className="bg-police-blue hover:bg-blue-600 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition shadow flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" /> Lọc Kết Quả
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results List */}
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2.5 border-b border-police-navy/30">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">KẾT QUẢ TRA CỨU ({pagination.total} bản ghi)</span>
              <span className="text-[10px] font-mono text-gray-400">Trang {pagination.page}/{pagination.totalPages}</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-t-police-gold border-r-transparent border-police-navy rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-mono">Đang truy vấn dữ liệu...</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="py-12 text-center text-gray-500 border border-dashed border-police-navy rounded-xl">
                Không tìm thấy lượt quét biển số xe trùng khớp với tiêu chí bộ lọc.
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => setSelectedScan(scan)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-4 ${
                      selectedScan?.id === scan.id 
                        ? 'bg-police-navy/30 border-police-accent' 
                        : 'bg-police-bg/40 border-police-navy/40 hover:border-police-navy/90'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Stylized license plate badge */}
                      <div className="bg-white border border-gray-400 rounded px-2 py-1 font-mono font-extrabold text-xs text-gray-900 tracking-wide select-all shadow-sm shrink-0">
                        {scan.plate_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-200 truncate">{scan.officer_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-police-gold shrink-0" />
                          <span className="truncate">{scan.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono">
                        <span className="block text-[10px] text-police-gold font-bold">
                          {new Date(scan.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="block text-[8px] text-gray-500">
                          {new Date(scan.timestamp).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScan(scan.id, scan.plate_number);
                          }}
                          className="p-1.5 hover:bg-red-950/40 rounded text-gray-500 hover:text-police-red transition"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-police-navy/30 pt-3 mt-4 text-xs font-semibold">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchScans(pagination.page - 1)}
                className="bg-police-navy hover:bg-police-navy/80 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <span className="text-gray-400">Trang {pagination.page} / {pagination.totalPages}</span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchScans(pagination.page + 1)}
                className="bg-police-navy hover:bg-police-navy/80 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: RADAR MAP CANVAS & POPUPS */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Radar Map Component */}
        <div className="bg-police-card rounded-2xl border border-police-navy/80 p-4 shadow-xl flex-1 flex flex-col justify-between">
          <div className="mb-3">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-police-accent animate-spin" style={{ animationDuration: '6s' }} /> BẢN ĐỒ TỌA ĐỘ PHÁT HIỆN RADAR CSGT
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Plot toàn bộ tọa độ GPS tuần tra thời gian thực</p>
          </div>

          {/* Stylized Tactical Radar Plot Map Canvas */}
          <div className="relative w-full aspect-square bg-slate-950 border border-police-navy rounded-xl custom-map-grid overflow-hidden flex items-center justify-center p-4">
            
            {/* Center target cursor cross */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-full h-[1px] bg-police-navy/20" />
              <div className="h-full w-[1px] bg-police-navy/20" />
              <div className="absolute w-44 h-44 border border-police-navy/20 rounded-full animate-pulse" />
              <div className="absolute w-24 h-24 border border-police-navy/35 rounded-full" />
              <div className="absolute w-8 h-8 border border-police-accent/30 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-police-accent rounded-full" />
              </div>
            </div>

            {/* Interactive Markers generated from scans coordinates */}
            {scans.slice(0, 15).map((scan) => {
              // Convert coordinates to stylized coordinates on the box relative to first coordinate
              // Map center is roughly Hanoi center (21.0285, 105.8048)
              const latDelta = (scan.latitude - 21.0285) * 8000;
              const lngDelta = (scan.longitude - 105.8048) * 8000;
              
              // Safe clamps within 10% to 90% space of container
              const posX = Math.max(12, Math.min(88, 50 + lngDelta));
              const posY = Math.max(12, Math.min(88, 50 - latDelta));

              return (
                <button
                  key={scan.id}
                  onClick={() => setSelectedScan(scan)}
                  className={`absolute w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-transform hover:scale-125 z-20 ${
                    selectedScan?.id === scan.id 
                      ? 'bg-police-accent border-white shadow-[0_0_12px_#38bdf8] scale-110' 
                      : 'bg-police-gold border-black hover:bg-white'
                  }`}
                  style={{ top: `${posY}%`, left: `${posX}%` }}
                  title={`${scan.plate_number} - ${scan.officer_name}`}
                >
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </button>
              );
            })}

            {/* Ambient North Arrow */}
            <div className="absolute top-3 right-3 font-mono text-[9px] text-gray-500 font-bold bg-black/85 px-1.5 py-0.5 rounded border border-police-navy/50">
              N &uarr;
            </div>
            
            {/* Ambient Info Legend */}
            <div className="absolute bottom-3 left-3 font-mono text-[9px] text-emerald-400 font-bold bg-black/85 px-2 py-1 rounded border border-police-navy/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-police-gold rounded-full animate-ping" />
              CSGT Radar Active
            </div>
          </div>

          {/* Selected Marker detail popup panel */}
          <AnimatePresence mode="wait">
            {selectedScan ? (
              <motion.div
                key={selectedScan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 bg-police-bg/80 border border-police-navy p-3.5 rounded-xl space-y-2.5 text-xs"
              >
                <div className="flex justify-between items-center">
                  <div className="bg-white border border-gray-400 rounded px-1.5 py-0.5 font-mono font-extrabold text-[11px] text-gray-900 tracking-wide leading-none select-all shadow-sm">
                    {selectedScan.plate_number}
                  </div>
                  <span className="font-mono text-[9px] text-gray-400 font-bold uppercase">
                    Quét lúc: {new Date(selectedScan.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-300 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-police-accent shrink-0" />
                    <span>Cán bộ: {selectedScan.officer_name} ({selectedScan.officer_rank})</span>
                  </p>
                  <p className="text-gray-400 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-police-gold shrink-0" />
                    <span className="truncate" title={selectedScan.address}>Vị trí: {selectedScan.address}</span>
                  </p>
                  <p className="text-gray-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Hệ tuần tra: {selectedScan.team_name} &bull; Tốc độ xe: {selectedScan.speed} km/h</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="mt-4 bg-police-bg/40 border border-dashed border-police-navy p-4 rounded-xl text-center text-gray-500 text-xs">
                Chưa có tọa độ nào được lựa chọn. Click chọn điểm marker trên radar.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
