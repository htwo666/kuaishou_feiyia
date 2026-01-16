
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Inheritor, ViewType, SiteConfig, ArchiveState } from './types';
import { INITIAL_INHERITORS, DEFAULT_SITE_CONFIG } from './constants';
import { InheritorCard } from './components/InheritorCard';
import { InheritorDetail } from './components/InheritorDetail';
import { InheritorForm } from './components/InheritorForm';
import { SiteConfigForm } from './components/SiteConfigForm';
import { Button } from './components/Button';

const STORAGE_KEY = 'ich_archive_full_v5';
const SYNC_API_BASE = 'https://api.npoint.io/bins';

const KuaishouLogo = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center select-none group">
    <div className="flex flex-col items-start leading-none">
      <div className={`text-2xl font-black tracking-tight transition-colors duration-500 ${light ? 'text-white' : 'text-gray-900'}`}>
        快手公益基金会
      </div>
      <div className={`text-[8px] font-black uppercase tracking-[0.25em] mt-1 transition-opacity duration-500 ${light ? 'text-white/40' : 'text-gray-400'}`}>
        Charity Foundation
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // 核心状态：传承人与配置
  const [inheritors, setInheritors] = useState<Inheritor[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  
  // UI 状态
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedInheritorId, setSelectedInheritorId] = useState<string | null>(null);
  const [editingInheritor, setEditingInheritor] = useState<Inheritor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 同步管理
  const [syncId, setSyncId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'local' | 'connecting' | 'synced' | 'pushing' | 'error'>('local');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  // 内部引用：用于比对版本，防止无限循环同步
  const lastKnownCloudJson = useRef<string>('');
  const debounceTimer = useRef<number | null>(null);
  const isUpdatingLocally = useRef(false);

  // 1. 初始化：优先加载 URL ID，其次加载本地
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const archiveId = params.get('archive');
    
    if (archiveId) {
      setSyncId(archiveId);
      loadFullArchive(archiveId);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: ArchiveState = JSON.parse(saved);
          setInheritors(parsed.inheritors);
          setSiteConfig(parsed.siteConfig);
        } catch (e) {
          setInheritors(INITIAL_INHERITORS);
        }
      } else {
        setInheritors(INITIAL_INHERITORS);
      }
    }
  }, []);

  // 2. 核心同步逻辑
  const loadFullArchive = async (id: string) => {
    setSyncStatus('connecting');
    try {
      const resp = await fetch(`${SYNC_API_BASE}/${id}`);
      if (!resp.ok) throw new Error("Invalid Room");
      const data: ArchiveState = await resp.json();
      
      const dataStr = JSON.stringify(data);
      lastKnownCloudJson.current = dataStr;
      
      setInheritors(data.inheritors);
      setSiteConfig(data.siteConfig);
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
    } catch (e) {
      setSyncStatus('error');
      console.error("Cloud Error", e);
    }
  };

  const pushFullArchive = async (id: string, state: ArchiveState) => {
    setSyncStatus('pushing');
    try {
      const resp = await fetch(`${SYNC_API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (!resp.ok) throw new Error("Push Failed");
      
      lastKnownCloudJson.current = JSON.stringify(state);
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
    } catch (e) {
      setSyncStatus('error');
    }
  };

  const createArchiveRoom = async () => {
    setSyncStatus('connecting');
    try {
      const state: ArchiveState = {
        inheritors,
        siteConfig,
        lastUpdated: Date.now()
      };
      const resp = await fetch(SYNC_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      const result = await resp.json();
      const id = result.id;
      
      setSyncId(id);
      window.history.replaceState({}, '', `?archive=${id}`);
      setSyncStatus('synced');
      lastKnownCloudJson.current = JSON.stringify(state);
      alert(`云端档案库已创建！\nID: ${id}\n已复制邀请链接，分享给他人可实时协作。`);
      navigator.clipboard.writeText(window.location.href);
    } catch (e) {
      alert("创建同步失败，请检查网络。");
      setSyncStatus('error');
    }
  };

  // 3. 自动同步逻辑：监听到状态改变时触发防抖推送
  useEffect(() => {
    // 始终保存到本地
    const currentState: ArchiveState = {
      inheritors,
      siteConfig,
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));

    // 如果启用了同步，检查是否需要推送
    if (syncId) {
      const currentJson = JSON.stringify(currentState);
      if (currentJson !== lastKnownCloudJson.current) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
          pushFullArchive(syncId, currentState);
        }, 1500);
      }
    }
  }, [inheritors, siteConfig, syncId]);

  // 4. 实时轮询：获取他人的改动
  useEffect(() => {
    if (!syncId) return;
    const interval = setInterval(async () => {
      // 如果当前正在推送，或者处于连接错误状态，跳过轮询
      if (syncStatus === 'pushing' || syncStatus === 'connecting') return;
      
      try {
        const resp = await fetch(`${SYNC_API_BASE}/${syncId}`);
        if (!resp.ok) return;
        const cloudData: ArchiveState = await resp.json();
        const cloudJson = JSON.stringify(cloudData);
        
        // 只有云端数据与我们已知的数据不同时才更新（避免覆盖本地未提交的修改）
        if (cloudJson !== lastKnownCloudJson.current) {
          lastKnownCloudJson.current = cloudJson;
          setInheritors(cloudData.inheritors);
          setSiteConfig(cloudData.siteConfig);
          setLastSyncTime(Date.now());
          setSyncStatus('synced');
        }
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [syncId, syncStatus]);

  // 搜索过滤
  const filteredInheritors = useMemo(() => {
    if (!searchQuery.trim()) return inheritors;
    const q = searchQuery.toLowerCase().trim();
    return inheritors.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.skillAndLevel.toLowerCase().includes(q) ||
      i.works.some(w => w.name.toLowerCase().includes(q))
    );
  }, [inheritors, searchQuery]);

  const handleSaveInheritor = (data: Inheritor) => {
    setInheritors(prev => {
      const index = prev.findIndex(i => i.id === data.id);
      if (index !== -1) {
        const newList = [...prev];
        newList[index] = { ...data, updatedAt: Date.now() };
        return newList;
      }
      return [{ ...data, updatedAt: Date.now() }, ...prev];
    });
    setEditingInheritor(null);
    setCurrentView('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('同步模式下，删除将同步给所有协作者。确定吗？')) {
      setInheritors(prev => prev.filter(i => i.id !== id));
      setCurrentView('list');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF9] selection:bg-[#FF5000]/10">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => { setCurrentView('list'); setSelectedInheritorId(null); setSearchQuery(''); }}>
            <KuaishouLogo />
            <div className="hidden lg:flex items-center ml-8 pl-8 border-l border-gray-100 space-x-3">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 serif tracking-widest leading-tight">{siteConfig.headerTitle}</span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{siteConfig.headerSubtitle}</span>
              </div>
              
              <div className="flex items-center ml-4 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                  syncStatus === 'synced' ? 'bg-green-500 animate-pulse' : 
                  syncStatus === 'pushing' ? 'bg-[#FF5000] animate-bounce' : 
                  syncStatus === 'connecting' ? 'bg-blue-400 animate-spin' : 
                  syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                  {syncStatus === 'synced' ? 'Cloud Connected' : syncStatus === 'pushing' ? 'Updating...' : syncStatus === 'connecting' ? 'Connecting...' : syncStatus === 'error' ? 'Sync Error' : 'Local Archive'}
                </span>
                {syncId && <span className="text-[9px] text-gray-300 ml-2 font-mono">#{syncId}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 mr-6">
              {!syncId ? (
                <button onClick={createArchiveRoom} className="text-[10px] font-black text-[#FF5000] uppercase tracking-widest hover:underline">开启实时协作</button>
              ) : (
                <button onClick={() => { if(confirm('退出协作？数据将保留在本地，但不再接收远程更新。')) { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); } }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">退出同步</button>
              )}
            </div>
            <button onClick={() => setCurrentView('settings')} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-[#FF5000] transition-colors">⚙</button>
            <Button onClick={() => { setEditingInheritor(null); setCurrentView('upload'); }} className="!bg-[#FF5000] !hover:bg-[#E64800]">录入档案</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-16 flex-1 w-full">
        {currentView === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12 space-y-4">
              <div className="flex justify-between items-end flex-wrap gap-6">
                <div>
                  <span className="text-[10px] font-black text-[#FF5000] uppercase tracking-[0.4em] block">Digital Archive System</span>
                  <h2 className="text-4xl md:text-5xl font-black text-gray-900 serif mt-2">非遗传习学堂档案库</h2>
                </div>
                {syncId && lastSyncTime > 0 && (
                  <div className="text-right pb-1">
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Last Cloud Sync</p>
                    <p className="text-[10px] text-gray-900 font-mono">{new Date(lastSyncTime).toLocaleTimeString()}</p>
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-400 font-light max-w-2xl">
                已收录 <span className="text-gray-900 font-bold">{inheritors.length}</span> 位传承人档案。通过云端实时协作，守护匠心之美。
              </p>
            </header>

            <div className="mb-12 relative max-w-xl group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 transition-colors duration-300 ${searchQuery ? 'text-[#FF5000]' : 'text-gray-300 group-hover:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text"
                placeholder="搜索传承人姓名、头衔或具体作品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm outline-none transition-all duration-300 focus:ring-4 focus:ring-[#FF5000]/5 focus:border-[#FF5000] text-gray-700 placeholder-gray-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center px-2 text-gray-300 hover:text-red-400 transition-colors">✕</button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredInheritors.map(i => (
                <InheritorCard key={i.id} inheritor={i} onViewDetail={(id) => { setSelectedInheritorId(id); setCurrentView('detail'); }} />
              ))}
              
              {!searchQuery && (
                <div 
                  className="group relative aspect-[4/5] rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center p-8 cursor-pointer hover:border-[#FF5000]/30 hover:bg-white transition-all duration-500"
                  onClick={() => { setEditingInheritor(null); setCurrentView('upload'); }}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-[#FF5000]/5 transition-colors text-gray-200 group-hover:text-[#FF5000]">
                      <span className="text-3xl">+</span>
                  </div>
                  <p className="text-gray-300 group-hover:text-gray-500 font-bold text-[10px] uppercase tracking-widest text-center">录入新档案</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedInheritorId && (
          <InheritorDetail 
            inheritor={inheritors.find(i => i.id === selectedInheritorId)!} 
            onBack={() => setCurrentView('list')} 
            onEdit={(i) => { setEditingInheritor(i); setCurrentView('upload'); }}
            onDelete={handleDelete}
          />
        )}

        {currentView === 'upload' && (
          <InheritorForm initialData={editingInheritor} onSave={handleSaveInheritor} onCancel={() => setCurrentView('list')} />
        )}

        {currentView === 'settings' && (
          <SiteConfigForm config={siteConfig} onSave={(c) => { setSiteConfig(c); setCurrentView('list'); }} onCancel={() => setCurrentView('list')} />
        )}
      </main>

      <footer className="bg-[#121212] pt-24 pb-16 text-white overflow-hidden relative border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
                <div className="md:col-span-5 space-y-12">
                    <KuaishouLogo light />
                    <p className="text-gray-500 text-sm font-light leading-relaxed max-w-sm">
                        {siteConfig.footerDescription}
                    </p>
                    {syncId && (
                      <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                        <span className="text-[10px] font-black text-[#FF5000] uppercase tracking-widest mr-3">Cloud Sync ID</span>
                        <code className="text-xs font-mono text-white/60">{syncId}</code>
                      </div>
                    )}
                </div>
                <div className="md:col-span-7 flex flex-wrap justify-between gap-12">
                    <div className="space-y-6 min-w-[120px]">
                        <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">服务体系</h4>
                        <ul className="space-y-4 text-sm font-medium text-gray-400">
                            {siteConfig.footerTags.map((tag, idx) => (
                              <li key={idx} className="hover:text-[#FF5000] cursor-pointer transition-all duration-300 hover:translate-x-1">{tag}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">实时数字化入口</h4>
                        <div className="flex items-start gap-8">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-[#FF5000] to-[#FF8000] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative w-32 h-32 bg-white p-2.5 rounded-[1.8rem] shadow-2xl flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={siteConfig.footerQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}&color=121212`} 
                                      alt="同步二维码" 
                                      className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white tracking-wider">{syncId ? '扫码加入协作' : '扫码查阅档案'}</p>
                                    <p className="text-[10px] text-[#FF5000] font-black uppercase tracking-widest">{syncId ? 'REALTIME COLLAB' : 'DIGITAL ACCESS'}</p>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed font-light italic">
                                    {syncId ? '扫描当前页面的二维码\n其他人即可立刻进入该档案库\n实现多端同步编辑与查阅' : '扫描上方二维码\n获取更多非遗数字化相关讯息\n科技赋能，匠心传承'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">© 2025 KUAISHOU CHARITY FOUNDATION. REALTIME SYNC ENABLED.</p>
                <div className="flex gap-8">
                    <button className="text-[10px] text-gray-700 hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</button>
                    <button className="text-[10px] text-gray-700 hover:text-white transition-colors uppercase tracking-widest">Cloud API</button>
                </div>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#FF5000]/5 to-transparent pointer-events-none skew-x-12 translate-x-1/4"></div>
      </footer>
    </div>
  );
};

export default App;
