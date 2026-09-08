import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Sun,
  Home,
  SlidersHorizontal,
} from 'lucide-react';
import { User, AttendanceRecord, GeofenceConfig } from '../../types';

interface StaffAttendanceChartProps {
  currentUser: User;
  records: AttendanceRecord[];
  geofenceConfig: GeofenceConfig;
}

// Convert "HH:mm:ss" or "HH:mm" to decimal hour (e.g. "07:30" => 7.5)
function timeStringToDecimalHour(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  const hours = parts[0];
  const minutes = parts[1];
  const seconds = parts[2] || 0;
  return Number((hours + minutes / 60 + seconds / 3600).toFixed(2));
}

// Format decimal hour back to "HH:mm WITA"
function decimalHourToTimeString(dec: number): string {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm} WITA`;
}

export const StaffAttendanceChart: React.FC<StaffAttendanceChartProps> = ({
  currentUser,
  records,
  geofenceConfig,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7days' | '14days'>('7days');

  // Filter records strictly for current user
  const userRecords = useMemo(() => {
    const list = records.filter((r) => r.userId === currentUser.id);
    // sort ascending by date
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list;
  }, [records, currentUser.id]);

  // Transform data for recharts
  const chartData = useMemo(() => {
    let dataset = [...userRecords];
    if (dateRangeFilter === '7days') {
      dataset = dataset.slice(-7);
    } else if (dateRangeFilter === '14days') {
      dataset = dataset.slice(-14);
    }

    return dataset.map((item) => {
      const inDec = timeStringToDecimalHour(item.checkInTime);
      const outDec = timeStringToDecimalHour(item.checkOutTime);

      // Format date for X-Axis (e.g. "Sen 25/08" or "25/08")
      const dateObj = new Date(item.date);
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dayName = isNaN(dateObj.getTime()) ? '' : dayNames[dateObj.getDay()];
      const dayMonth = item.date.slice(5).replace('-', '/');
      const label = dayName ? `${dayName}, ${dayMonth}` : item.date;

      // Calculate work duration in hours & minutes if both present
      let durationStr = '-';
      if (inDec !== null && outDec !== null && outDec > inDec) {
        const diffMinutes = Math.round((outDec - inDec) * 60);
        const diffH = Math.floor(diffMinutes / 60);
        const diffM = diffMinutes % 60;
        durationStr = `${diffH} jam ${diffM} mnt`;
      }

      return {
        id: item.id,
        date: item.date,
        label,
        checkInTime: item.checkInTime || null,
        checkOutTime: item.checkOutTime || null,
        jamMasuk: inDec,
        jamPulang: outDec,
        status: item.checkInStatus,
        durationStr,
      };
    });
  }, [userRecords, dateRangeFilter]);

  // Parse config limits into decimals
  const deadlineInDec = useMemo(() => {
    return timeStringToDecimalHour(geofenceConfig.checkInDeadlineTime) || 7.5; // default 07:30
  }, [geofenceConfig.checkInDeadlineTime]);

  const checkoutStartDec = useMemo(() => {
    return timeStringToDecimalHour(geofenceConfig.checkOutStartTime) || 12.5; // default 12:30
  }, [geofenceConfig.checkOutStartTime]);

  // Summary Metrics calculations
  const validInRecords = chartData.filter((d) => d.jamMasuk !== null);
  const avgInDec =
    validInRecords.length > 0
      ? validInRecords.reduce((acc, curr) => acc + (curr.jamMasuk || 0), 0) /
        validInRecords.length
      : null;

  const validOutRecords = chartData.filter((d) => d.jamPulang !== null);
  const avgOutDec =
    validOutRecords.length > 0
      ? validOutRecords.reduce((acc, curr) => acc + (curr.jamPulang || 0), 0) /
        validOutRecords.length
      : null;

  const onTimeCount = validInRecords.filter(
    (d) => d.status === 'TEPAT_WAKTU' || (d.jamMasuk !== null && d.jamMasuk <= deadlineInDec)
  ).length;

  const onTimePercentage =
    validInRecords.length > 0
      ? Math.round((onTimeCount / validInRecords.length) * 100)
      : 100;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-2 border border-slate-700 min-w-[210px] backdrop-blur-md">
          <div className="border-b border-slate-700 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-sky-400">{data?.label || label || ''}</span>
            <span className="text-[10px] text-slate-400 font-mono">{data?.date || ''}</span>
          </div>

          <div className="space-y-1.5">
            {/* Jam Kedatangan */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Sun className="w-3.5 h-3.5" />
                <span>Jam Kedatangan:</span>
              </div>
              <span className="font-bold text-white font-mono">
                {data.checkInTime ? `${data.checkInTime} WITA` : 'Belum Absen'}
              </span>
            </div>

            {/* Jam Kepulangan */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <Home className="w-3.5 h-3.5" />
                <span>Jam Kepulangan:</span>
              </div>
              <span className="font-bold text-white font-mono">
                {data.checkOutTime ? `${data.checkOutTime} WITA` : 'Belum Absen'}
              </span>
            </div>

            {/* Durasi Kehadiran */}
            {data.durationStr !== '-' && (
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                <span>Durasi Berada di Sekolah:</span>
                <span className="font-semibold text-amber-300">{data.durationStr}</span>
              </div>
            )}

            {/* Status Kehadiran */}
            <div className="pt-1 text-center">
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  data.status === 'TEPAT_WAKTU'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-rose-950 text-rose-300 border border-rose-700'
                }`}
              >
                {data.status === 'TEPAT_WAKTU' ? '✓ Tepat Waktu' : 'Terlambat'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0088cc] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Grafik Jam Kedatangan & Kepulangan
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi tren waktu check-in pagi dan waktu pulang {currentUser.name}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Range Selection */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setDateRangeFilter('7days')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateRangeFilter === '7days'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateRangeFilter('14days')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateRangeFilter === '14days'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              14 Hari
            </button>
            <button
              onClick={() => setDateRangeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateRangeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded-lg transition ${
                chartType === 'line'
                  ? 'bg-[#0088cc] text-white shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
              title="Grafik Garis Tren"
            >
              Garis
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2 py-1 rounded-lg transition ${
                chartType === 'bar'
                  ? 'bg-[#0088cc] text-white shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
              title="Grafik Batang Jam"
            >
              Batang
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded-lg transition ${
                chartType === 'area'
                  ? 'bg-[#0088cc] text-white shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
              title="Grafik Area Jam"
            >
              Area
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row for Quick Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Rata-rata Masuk */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-sky-800 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Rata-rata Masuk</span>
            </span>
            <span className="text-[10px] text-sky-600 font-normal">
              Batas {geofenceConfig.checkInDeadlineTime}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {avgInDec !== null ? decimalHourToTimeString(avgInDec) : '-'}
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Tiba sebelum batas sekolah</span>
          </p>
        </div>

        {/* Metric 2: Rata-rata Pulang */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-indigo-800 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rata-rata Pulang</span>
            </span>
            <span className="text-[10px] text-indigo-600 font-normal">
              Mulai {geofenceConfig.checkOutStartTime}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {avgOutDec !== null ? decimalHourToTimeString(avgOutDec) : '-'}
          </div>
          <p className="text-[10px] text-indigo-700 font-medium mt-0.5">
            Sesuai jam kepulangan anak
          </p>
        </div>

        {/* Metric 3: Persentase Tepat Waktu */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
          <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
            Tingkat Ketepatan
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
            {onTimePercentage}%
          </div>
          <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
            {onTimeCount} dari {validInRecords.length} hari tepat waktu
          </p>
        </div>

        {/* Metric 4: Total Hari Hadir */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
            Total Kehadiran
          </div>
          <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
            {validInRecords.length} Hari
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Tercatat di sistem presensi
          </p>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-[300px] sm:h-[340px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[6, 14]}
                ticks={[6, 7, 7.5, 8, 10, 12, 12.5, 13, 14]}
                tickFormatter={(val) => decimalHourToTimeString(val).replace(' WITA', '')}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: '11px', fontWeight: 600 }}
              />

              {/* Reference line for check-in deadline (07:30 WITA) */}
              <ReferenceLine
                y={deadlineInDec}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Batas Masuk: ${geofenceConfig.checkInDeadlineTime} WITA`,
                  position: 'insideTopLeft',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              {/* Reference line for checkout start (12:30 WITA) */}
              <ReferenceLine
                y={checkoutStartDec}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: `Jam Pulang: ${geofenceConfig.checkOutStartTime} WITA`,
                  position: 'insideBottomLeft',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              <Line
                type="monotone"
                dataKey="jamMasuk"
                name="Jam Kedatangan (Masuk)"
                stroke="#0088cc"
                strokeWidth={3}
                dot={{ r: 5, fill: '#0088cc', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#0088cc' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="jamPulang"
                name="Jam Kepulangan (Pulang)"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#6366f1' }}
                connectNulls
              />
            </LineChart>
          ) : chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[6, 14]}
                ticks={[6, 7, 7.5, 8, 10, 12, 12.5, 13, 14]}
                tickFormatter={(val) => decimalHourToTimeString(val).replace(' WITA', '')}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: '11px', fontWeight: 600 }}
              />

              <ReferenceLine
                y={deadlineInDec}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Batas Masuk: ${geofenceConfig.checkInDeadlineTime} WITA`,
                  position: 'insideTopLeft',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
              <ReferenceLine
                y={checkoutStartDec}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: `Jam Pulang: ${geofenceConfig.checkOutStartTime} WITA`,
                  position: 'insideBottomLeft',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              <Bar
                dataKey="jamMasuk"
                name="Jam Kedatangan (Masuk)"
                fill="#0088cc"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="jamPulang"
                name="Jam Kepulangan (Pulang)"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 25, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0088cc" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0088cc" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPulang" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[6, 14]}
                ticks={[6, 7, 7.5, 8, 10, 12, 12.5, 13, 14]}
                tickFormatter={(val) => decimalHourToTimeString(val).replace(' WITA', '')}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: '11px', fontWeight: 600 }}
              />

              <ReferenceLine
                y={deadlineInDec}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: `Batas Masuk: ${geofenceConfig.checkInDeadlineTime} WITA`,
                  position: 'insideTopLeft',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
              <ReferenceLine
                y={checkoutStartDec}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: `Jam Pulang: ${geofenceConfig.checkOutStartTime} WITA`,
                  position: 'insideBottomLeft',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              <Area
                type="monotone"
                dataKey="jamMasuk"
                name="Jam Kedatangan (Masuk)"
                stroke="#0088cc"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMasuk)"
              />
              <Area
                type="monotone"
                dataKey="jamPulang"
                name="Jam Kepulangan (Pulang)"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPulang)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Educational Note / Legend explanation for teachers */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <b>Catatan Kedisiplinan:</b> Jam kedatangan di bawah garis merah putus-putus (<span className="text-red-600 font-bold">{geofenceConfig.checkInDeadlineTime} WITA</span>) dihitung sebagai <b>Tepat Waktu</b>. Jam pulang di atas garis hijau putus-putus (<span className="text-emerald-600 font-bold">{geofenceConfig.checkOutStartTime} WITA</span>) menandakan kepulangan sesuai jam tugas.
          </span>
        </div>
      </div>
    </div>
  );
};
