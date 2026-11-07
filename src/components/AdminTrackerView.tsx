import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, MapPin, Activity, Shield, RefreshCw, Download, 
  Search, Filter, ExternalLink, MessageSquare, Radio, 
  Compass, CheckCircle2, AlertCircle, Clock, Smartphone, 
  Globe, Sparkles, HelpCircle, Eye, X, ChevronRight, BarChart3
} from 'lucide-react';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  province: string;
  isTargetProvince: boolean;
  district?: string;
  address?: string;
  source: 'telegram_gps' | 'web_gps' | 'manual_selection' | 'ip_estimate';
  capturedAt: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  action: 'start' | 'message' | 'photo_diagnosis' | 'voice_query' | 'location_share' | 'tts_listen' | 'faq_read';
  details: string;
  category?: 'crop' | 'livestock' | 'general' | 'location';
  locationSnapshot?: string;
}

export interface TrackedUser {
  id: string;
  platform: 'telegram' | 'web';
  name: string;
  username?: string;
  avatarUrl?: string;
  firstSeen: string;
  lastActive: string;
  sessionCount: number;
  messageCount: number;
  cropInterests: string[];
  lastQuery?: string;
  location?: UserLocation;
  activities: UserActivityLog[];
  status: 'active' | 'idle' | 'offline';
}

export interface TargetProvinceInfo {
  nameKh: string;
  nameEn: string;
  lat: number;
  lng: number;
  radiusKm: number;
  isLasedTarget: boolean;
}

interface AdminDataResponse {
  users: TrackedUser[];
  stats: {
    totalUsers: number;
    telegramUsers: number;
    webUsers: number;
    activeToday: number;
    withLocation: number;
    inTargetProvinces: number;
    totalMessages: number;
    provinceCounts: Record<string, { count: number; isTarget: boolean; lat: number; lng: number }>;
    targetProvincesTotal: number;
    targetProvincesRepresented: number;
  };
  activities: UserActivityLog[];
  provinces: TargetProvinceInfo[];
}

export const LASED_14_PROVINCES = [
  'កំពង់ឆ្នាំង', 'បាត់ដំបង', 'បន្ទាយមានជ័យ', 'ឧត្តរមានជ័យ',
  'ក្រចេះ', 'ស្ទឹងត្រែង', 'រតនគិរី', 'មណ្ឌលគិរី',
  'កំពង់ធំ', 'ត្បូងឃ្មុំ', 'កំពង់ស្ពឺ', 'ព្រះសីហនុ',
  'កំពត', 'កែប'
];

export function AdminTrackerView() {
  const [data, setData] = useState<AdminDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'telegram' | 'web'>('all');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [locationOnlyFilter, setLocationOnlyFilter] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TrackedUser | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'users' | 'activity'>('map');
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [hoveredUser, setHoveredUser] = useState<TrackedUser | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AdminDataResponse = await res.json();
      setData(json);
      setLastRefreshedAt(new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to fetch admin tracker data:', err);
      setError('មិនអាចទាញយកទិន្នន័យពី Server បានទេ។ សូមពិនិត្យការតភ្ជាប់។');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Periodic auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then((json: AdminDataResponse) => {
          setData(json);
          setLastRefreshedAt(new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter(u => {
      // Platform filter
      if (selectedPlatform !== 'all' && u.platform !== selectedPlatform) return false;
      // Location only filter
      if (locationOnlyFilter && !u.location) return false;
      // Province filter
      if (selectedProvinceFilter !== 'all') {
        if (!u.location || u.location.province !== selectedProvinceFilter) return false;
      }
      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchUsername = (u.username || '').toLowerCase().includes(q);
        const matchProvince = (u.location?.province || '').toLowerCase().includes(q);
        const matchDistrict = (u.location?.district || '').toLowerCase().includes(q);
        const matchInterests = (u.cropInterests || []).some(ci => ci.toLowerCase().includes(q));
        const matchQuery = (u.lastQuery || '').toLowerCase().includes(q);
        return matchName || matchUsername || matchProvince || matchDistrict || matchInterests || matchQuery;
      }
      return true;
    });
  }, [data?.users, selectedPlatform, selectedProvinceFilter, locationOnlyFilter, searchQuery]);

  // Export to CSV for LASED III official reporting
  const handleExportCSV = () => {
    if (!data?.users || data.users.length === 0) return;
    const headers = [
      'ID',
      'Platform',
      'Farmer Name',
      'Username',
      'Province (Khmer)',
      'Is Target Province (14 LASED III)',
      'Latitude',
      'Longitude',
      'Location Source',
      'Messages Count',
      'Crop Interests',
      'Last Active',
      'Latest Query'
    ];

    const rows = data.users.map(u => [
      u.id,
      u.platform,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.username || '',
      u.location?.province || 'មិនទាន់ចាប់ទីតាំង',
      u.location?.isTargetProvince ? 'Yes' : 'No',
      u.location?.latitude || '',
      u.location?.longitude || '',
      u.location?.source || '',
      u.messageCount || 0,
      `"${(u.cropInterests || []).join(', ')}"`,
      u.lastActive,
      `"${(u.lastQuery || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LASED_III_Users_Location_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LASED_III_Tracking_Data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convert GPS Coordinates to Cambodia SVG canvas coordinates
  // Cambodia Bounding Box: Lat 10.0 - 14.7 deg N, Lng 102.3 - 107.6 deg E
  const mapWidth = 800;
  const mapHeight = 600;
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 10.0;
    const maxLat = 14.7;
    const minLng = 102.3;
    const maxLng = 107.6;

    const x = ((lng - minLng) / (maxLng - minLng)) * (mapWidth - 120) + 60;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (mapHeight - 120) + 60;
    return { x, y };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-300 text-xs font-semibold tracking-wide border border-emerald-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>ផ្ទាំងគ្រប់គ្រងរដ្ឋបាលគម្រោង (Admin Monitoring Dashboard)</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              តាមដានអ្នកប្រើប្រាស់ Bot & ចាប់ទីតាំងកសិដ្ឋាន
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              ប្រព័ន្ធតាមដានកសិករពេលចូលប្រើប្រាស់ **LASEDIII_Help_Bot** លើ Telegram និង Web ព្រមទាំងចាប់កូអរដោនេ GPS ទីតាំងកសិដ្ឋាន គ្របដណ្តប់ខេត្តគោលដៅទាំង ១៤ នៃគម្រោង LASED III (MLMUPC & MAFF)។
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all border border-white/10"
              title="ទាញយកទិន្នន័យថ្មី"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>ទាញយកទិន្នន័យស្រស់</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
              title="នាំចេញជា CSV សម្រាប់របាយការណ៍គម្រោង"
            >
              <Download className="w-3.5 h-3.5" />
              <span>នាំចេញ CSV (Report)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 border border-slate-700 transition-all"
              title="នាំចេញទិន្នន័យដើម JSON"
            >
              <Download className="w-3 h-3" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Live sync status banner */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-emerald-200/80 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ការតភ្ជាប់បន្តផ្ទាល់ (Live Sync Active)</span>
            {lastRefreshedAt && <span className="text-emerald-300/60">· ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ: {lastRefreshedAt}</span>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 bg-white/20 border-white/30"
            />
            <span>Refresh ស្វ័យប្រវត្តិ (រៀងរាល់ ១៥ វិនាទី)</span>
          </label>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Tracked Users */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">កសិករបានចុះឈ្មោះ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {data?.stats.totalUsers ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-[#2AABEE] font-medium">Telegram: {data?.stats.telegramUsers ?? 0}</span>
              <span>·</span>
              <span className="text-emerald-600 font-medium">Web: {data?.stats.webUsers ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">សកម្មក្នុងថ្ងៃនេះ</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400">
              {data?.stats.activeToday ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              អ្នកសកម្មក្នុងរយៈពេល ២៤ ម៉ោង
            </div>
          </div>
        </div>

        {/* Card 3: Locations Captured */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ចាប់ទីតាំង GPS បាន</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {data?.stats.withLocation ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              មានកូអរដោនេកសិដ្ឋានជាក់លាក់
            </div>
          </div>
        </div>

        {/* Card 4: 14 Target Provinces Coverage */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ខេត្តគោលដៅ ១៤</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {data?.stats.targetProvincesRepresented ?? 0} <span className="text-sm font-normal text-slate-400">/ 14</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              មានកសិករនៅក្នុងខេត្តគោលដៅ
            </div>
          </div>
        </div>

        {/* Card 5: Total Bot Messages */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">សំណួរកសិកម្ម</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
              {data?.stats.totalMessages ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              សំណួរ-ចម្លើយបានដោះស្រាយ
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>ផែនទីទីតាំងកសិករ (Cambodia Farm Map)</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>បញ្ជីឈ្មោះកសិករ ({filteredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>សកម្មភាពចុងក្រោយ (Live Feed)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE CAMBODIA FARM MAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left 3 Columns: Visual Map Canvas */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-600" />
                    <span>ផែនទីកូអរដោនេទីតាំងកសិករទូទាំងប្រទេសកម្ពុជា</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    បង្ហាញទីតាំងជាក់ស្តែងដែលបានចាប់ពី Telegram GPS និង Web Geolocation
                  </p>
                </div>

                {/* Legend badges */}
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2AABEE]"></span>
                    Telegram User
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Web User
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full border border-amber-500 bg-amber-100"></span>
                    ខេត្តគោលដៅ ១៤
                  </span>
                </div>
              </div>

              {/* Map Canvas (SVG Vector Representation) */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                  className="w-full h-full select-none"
                >
                  <defs>
                    <radialGradient id="targetPulse" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </radialGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Cambodia Approximate Boundary Contour */}
                  <path
                    d="M 120,240 
                       L 180,110 
                       L 340,90 
                       L 520,100 
                       L 670,120 
                       L 740,240 
                       L 730,360 
                       L 620,440 
                       L 540,510 
                       L 400,530 
                       L 250,540 
                       L 190,460 
                       L 120,380 Z"
                    className="fill-emerald-50/40 dark:fill-emerald-950/20 stroke-emerald-300/60 dark:stroke-emerald-800/60 stroke-[1.5] stroke-dasharray-[4,4]"
                  />

                  {/* Tonle Sap Lake Indicator */}
                  <ellipse
                    cx="320"
                    cy="310"
                    rx="65"
                    ry="28"
                    transform="rotate(-28 320 310)"
                    className="fill-blue-100/60 dark:fill-blue-950/40 stroke-blue-300/40 dark:stroke-blue-800/40"
                  />
                  <text
                    x="320"
                    y="312"
                    textAnchor="middle"
                    className="text-[10px] fill-blue-500/70 dark:fill-blue-400/50 font-medium tracking-wider"
                  >
                    បឹងទន្លេសាប
                  </text>

                  {/* Mekong River Path */}
                  <path
                    d="M 520,80 Q 510,220 530,340 T 490,490 L 510,580"
                    fill="none"
                    className="stroke-blue-300/50 dark:stroke-blue-700/40 stroke-[2.5]"
                  />

                  {/* 14 LASED III Target Province Nodes */}
                  {(data?.provinces || []).map((prov) => {
                    const coords = projectCoords(prov.lat, prov.lng);
                    const count = data?.stats.provinceCounts[prov.nameKh]?.count || 0;
                    const isHovered = hoveredProvince === prov.nameKh;
                    const isSelected = selectedProvinceFilter === prov.nameKh;

                    return (
                      <g
                        key={prov.nameKh}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredProvince(prov.nameKh)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        onClick={() => setSelectedProvinceFilter(selectedProvinceFilter === prov.nameKh ? 'all' : prov.nameKh)}
                      >
                        {/* Target province circle zone */}
                        {prov.isLasedTarget && (
                          <circle
                            cx={coords.x}
                            cy={coords.y}
                            r={isHovered || isSelected ? 30 : 20}
                            className={`${
                              count > 0 
                                ? 'fill-emerald-500/15 stroke-emerald-500/40' 
                                : 'fill-amber-500/10 stroke-amber-500/30'
                            } stroke-[1] transition-all`}
                          />
                        )}

                        {/* Central Dot */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={prov.isLasedTarget ? (count > 0 ? 5 : 4) : 3}
                          className={`${
                            prov.isLasedTarget
                              ? (count > 0 ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-amber-500')
                              : 'fill-slate-400'
                          }`}
                        />

                        {/* Province Name Label */}
                        <text
                          x={coords.x}
                          y={coords.y + 14}
                          textAnchor="middle"
                          className={`text-[10px] font-medium pointer-events-none ${
                            prov.isLasedTarget
                              ? (count > 0 ? 'fill-emerald-800 dark:fill-emerald-200 font-bold' : 'fill-slate-600 dark:fill-slate-300')
                              : 'fill-slate-400 dark:fill-slate-600 text-[9px]'
                          }`}
                        >
                          {prov.nameKh} {count > 0 && `(${count})`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Real Farmers GPS Location Pins */}
                  {(data?.users || []).map((user) => {
                    if (!user.location) return null;
                    const coords = projectCoords(user.location.latitude, user.location.longitude);
                    const isHovered = hoveredUser?.id === user.id;
                    const isTelegram = user.platform === 'telegram';

                    return (
                      <g
                        key={user.id}
                        className="cursor-pointer group"
                        onClick={() => setSelectedUser(user)}
                        onMouseEnter={() => setHoveredUser(user)}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        {/* Pulsing ring for active farmers */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={isHovered ? 16 : 10}
                          className={`${isTelegram ? 'fill-[#2AABEE]/20 stroke-[#2AABEE]/50' : 'fill-emerald-500/20 stroke-emerald-500/50'} animate-ping opacity-75`}
                        />

                        {/* Pin Marker */}
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={isHovered ? 7 : 5}
                          className={`${
                            isTelegram
                              ? 'fill-[#2AABEE] stroke-white dark:stroke-slate-900'
                              : 'fill-emerald-500 stroke-white dark:stroke-slate-900'
                          } stroke-[2] shadow-md`}
                        />

                        {/* Hover Tooltip Label */}
                        {isHovered && (
                          <g transform={`translate(${coords.x}, ${coords.y - 28})`}>
                            <rect
                              x="-75"
                              y="-20"
                              width="150"
                              height="26"
                              rx="6"
                              className="fill-slate-900 text-white shadow-xl"
                            />
                            <text
                              x="0"
                              y="-4"
                              textAnchor="middle"
                              className="fill-white text-[10px] font-semibold"
                            >
                              {user.name.slice(0, 18)} ({user.location.province})
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Map Info Overlay */}
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ចុចលើចំណុចទីតាំងដើម្បីមើលព័ត៌មានកសិករលម្អិត</span>
                </div>
              </div>
            </div>

            {/* Right Column: 14 LASED III Provinces Distribution Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>ខេត្តគោលដៅទាំង ១៤</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {data?.stats.inTargetProvinces ?? 0} នាក់
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  ចំនួនកសិករដែលបានភ្ជាប់ Bot តាមបណ្តាខេត្តនីមួយៗនៃគម្រោង៖
                </p>

                {/* Scrollable list of 14 provinces */}
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {LASED_14_PROVINCES.map((provName) => {
                    const count = data?.stats.provinceCounts[provName]?.count || 0;
                    const isSelected = selectedProvinceFilter === provName;

                    return (
                      <button
                        key={provName}
                        onClick={() => setSelectedProvinceFilter(isSelected ? 'all' : provName)}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold'
                            : count > 0
                            ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                            : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                          <span>ខេត្ត{provName}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          count > 0 
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                            : 'text-slate-400'
                        }`}>
                          {count} នាក់
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedProvinceFilter !== 'all' && (
                <button
                  onClick={() => setSelectedProvinceFilter('all')}
                  className="mt-3 w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  សម្អាត Filter (បង្ហាញគ្រប់ខេត្ត)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS DIRECTORY TABLE */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ, Username, ខេត្ត, ឬសំណួរ..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Platform selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setSelectedPlatform('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedPlatform === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  ទាំងអស់
                </button>
                <button
                  onClick={() => setSelectedPlatform('telegram')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedPlatform === 'telegram'
                      ? 'bg-[#2AABEE] text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Telegram
                </button>
                <button
                  onClick={() => setSelectedPlatform('web')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedPlatform === 'web'
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Web
                </button>
              </div>

              {/* Has Location Checkbox */}
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationOnlyFilter}
                  onChange={(e) => setLocationOnlyFilter(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>មាន GPS តែប៉ុណ្ណោះ</span>
              </label>

              {/* Province Selector */}
              <select
                value={selectedProvinceFilter}
                onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 border-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">គ្រប់ខេត្តទាំងអស់</option>
                {LASED_14_PROVINCES.map((p) => (
                  <option key={p} value={p}>ខេត្ត{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">កសិករ / អ្នកប្រើប្រាស់</th>
                  <th className="px-4 py-3.5">ប្រព័ន្ធ</th>
                  <th className="px-4 py-3.5">ទីតាំងកសិដ្ឋាន (GPS)</th>
                  <th className="px-4 py-3.5">ចំណាប់អារម្មណ៍</th>
                  <th className="px-4 py-3.5">សំណួរចុងក្រោយ</th>
                  <th className="px-4 py-3.5">ពេលសកម្ម</th>
                  <th className="px-4 py-3.5 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      ពុំមានទិន្នន័យកសិករត្រូវតាមលក្ខខណ្ឌស្វែងរកនេះឡើយ។
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const hasLoc = Boolean(u.location);
                    const isTarget = u.location?.isTargetProvince;

                    return (
                      <tr 
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(u)}
                      >
                        {/* Name & Username */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                              {u.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {u.username || u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Platform Badge */}
                        <td className="px-4 py-3.5">
                          {u.platform === 'telegram' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2AABEE]/15 text-[#2AABEE]">
                              <Smartphone className="w-3 h-3" />
                              Telegram
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              <Globe className="w-3 h-3" />
                              Web
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3.5">
                          {hasLoc && u.location ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ខេត្ត{u.location.province}</span>
                                {isTarget && (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded text-[10px]">
                                    LASED III
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {u.location.latitude.toFixed(4)}, {u.location.longitude.toFixed(4)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              មិនទាន់ចែករំលែក
                            </span>
                          )}
                        </td>

                        {/* Topics */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(u.cropInterests && u.cropInterests.length > 0) ? (
                              u.cropInterests.slice(0, 2).map((item) => (
                                <span
                                  key={item}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </div>
                        </td>

                        {/* Latest Query */}
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <p className="truncate text-slate-600 dark:text-slate-300 text-xs" title={u.lastQuery}>
                            {u.lastQuery || 'បានចូលប្រើប្រាស់ Bot'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {u.messageCount} សារសរុប
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(u.lastActive).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(u.lastActive).toLocaleDateString('km-KH')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(u);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>មើលលម្អិត</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE ACTIVITY STREAM */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>កំណត់ត្រាសកម្មភាពកសិករផ្ទាល់ (Real-time Activity Stream)</span>
            </h3>
            <span className="text-xs text-slate-400">
              បង្ហាញសកម្មភាព ៣០ ចុងក្រោយ
            </span>
          </div>

          <div className="space-y-3">
            {(!data?.activities || data.activities.length === 0) ? (
              <p className="text-center py-8 text-slate-400 text-xs">
                មិនទាន់មានកំណត់ត្រាសកម្មភាពថ្មីៗនៅឡើយទេ។
              </p>
            ) : (
              data.activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      {act.action === 'location_share' ? (
                        <MapPin className="w-4 h-4 text-blue-600" />
                      ) : act.action === 'photo_diagnosis' ? (
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {act.details}
                      </div>
                      {act.locationSnapshot && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3" />
                          <span>ទីតាំង៖ {act.locationSnapshot}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center">
                  {selectedUser.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedUser.username || selectedUser.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Location Section */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                ទីតាំងភូមិសាស្ត្រកសិដ្ឋាន (Farm GPS Coordinates)
              </span>

              {selectedUser.location ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        ខេត្ត{selectedUser.location.province}
                      </span>
                      {selectedUser.location.isTargetProvince && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                          ខេត្តគោលដៅ LASED III
                        </span>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${selectedUser.location.latitude},${selectedUser.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>បើក Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 flex items-center justify-between">
                    <span>Lat: {selectedUser.location.latitude.toFixed(6)}, Lng: {selectedUser.location.longitude.toFixed(6)}</span>
                    <span className="text-[10px] text-slate-400">ភាពជាក់លាក់: ±{selectedUser.location.accuracy || 10}m</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  កសិករពុំទាន់បានផ្ញើទីតាំង GPS នៅឡើយទេ។
                </p>
              )}
            </div>

            {/* Questions & Session Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[11px]">ចំនួនសារសរុប៖</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold text-sm">{selectedUser.messageCount} សារ</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block text-[11px]">ចូលប្រើប្រាស់ដំបូង៖</span>
                <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedUser.firstSeen).toLocaleDateString('km-KH')}</strong>
              </div>
            </div>

            {/* Topics */}
            {selectedUser.cropInterests && selectedUser.cropInterests.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  ប្រធានបទកសិកម្មចាប់អារម្មណ៍៖
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.cropInterests.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Last Query */}
            {selectedUser.lastQuery && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  សំណួរចុងក្រោយ៖
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                  "{selectedUser.lastQuery}"
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all"
            >
              បិទផ្ទាំងនេះ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
