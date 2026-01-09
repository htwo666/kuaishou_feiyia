
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Inheritor, ViewType, SiteConfig } from './types';
import { INITIAL_INHERITORS, DEFAULT_SITE_CONFIG } from './constants';
import { InheritorCard } from './components/InheritorCard';
import { InheritorDetail } from './components/InheritorDetail';
import { InheritorForm } from './components/InheritorForm';
import { SiteConfigForm } from './components/SiteConfigForm';
import { Button } from './components/Button';

const STORAGE_KEY = 'ich_archive_v4';
const CONFIG_KEY = 'ich_config_v4';
// GitHub 数据仓库配置
const GITHUB_REPO_OWNER = 'htwo666';
const GITHUB_REPO_NAME = 'kuaishou_feiyi_data';
const GITHUB_DATA_FILE = 'data/archive.json';
const GITHUB_CONFIG_FILE = 'data/config.json';
const DEFAULT_GITHUB_TOKEN = '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';

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
  const [inheritors, setInheritors] = useState<Inheritor[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedInheritorId, setSelectedInheritorId] = useState<string | null>(null);
  const [editingInheritor, setEditingInheritor] = useState<Inheritor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 同步状态管理
  const [syncId, setSyncId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  // 用于标记更新来源，防止循环同步
  const isRemoteUpdate = useRef(false);
  const debounceTimer = useRef<number | null>(null);

  // 1. 初始化数据加载
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const archiveId = params.get('archive');
    
    if (archiveId) {
      setSyncId(archiveId);
      loadFromCloud(archiveId);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInheritors(saved ? JSON.parse(saved) : INITIAL_INHERITORS);
    }

    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) setSiteConfig(JSON.parse(savedConfig));
  }, []);

  // 搜索逻辑
  const filteredInheritors = useMemo(() => {
    if (!searchQuery.trim()) return inheritors;
    const query = searchQuery.toLowerCase().trim();
    return inheritors.filter(i => {
      const nameMatch = i.name.toLowerCase().includes(query);
      const skillMatch = i.skillAndLevel.toLowerCase().includes(query);
      const worksMatch = i.works.some(w => 
        w.name.toLowerCase().includes(query) || 
        w.technique.toLowerCase().includes(query)
      );
      return nameMatch || skillMatch || worksMatch;
    });
  }, [inheritors, searchQuery]);

  // 2. 云端核心逻辑
  const loadFromCloud = async (id: string) => {
    if (syncStatus === 'syncing' && lastSyncTime !== 0) return; // 避免重叠加载
    setSyncStatus('syncing');
    try {
      const resp = await fetch(`${SYNC_API_BASE}${id}`);
      if (!resp.ok) throw new Error("Cloud archive not found");
      const data = await resp.json();
      
      // 检查数据是否真的改变了，避免不必要的渲染
      if (JSON.stringify(data) !== JSON.stringify(inheritors)) {
        isRemoteUpdate.current = true;
        setInheritors(data);
      }
      
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
    } catch (e) {
      console.error("Cloud Sync Error:", e);
      setSyncStatus('error');
    }
  };

  const saveToCloud = async (id: string, data: Inheritor[]) => {
    setSyncStatus('syncing');
    try {
      const resp = await fetch(`${SYNC_API_BASE}${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!resp.ok) throw new Error("Push failed");
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
    } catch (e) {
      setSyncStatus('error');
    }
  };

  const createSyncRoom = async () => {
    setSyncStatus('syncing');
    try {
      const resp = await fetch(SYNC_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inheritors)
      });
      const result = await resp.json();
      const id = result.id;
      setSyncId(id);
      window.history.replaceState({}, '', `?archive=${id}`);
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
      alert(`已成功创建云端档案！\n您的提取码为: ${id}\n链接已复制，他人扫码或通过链接即可实时协作。`);
      navigator.clipboard.writeText(window.location.href);
    } catch (e) {
      console.error(e);
      alert("云端服务暂时无法连接，请稍后再试。");
      setSyncStatus('error');
    }
  };

  // 3. 自动同步心跳 (仅用于拉取他人更新)
  useEffect(() => {
    if (!syncId) return;
    const interval = setInterval(() => {
      loadFromCloud(syncId);
    }, 10000); 
    return () => clearInterval(interval);
  }, [syncId]);

  // 4. 持久化存储
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inheritors));
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (syncId) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(() => {
        saveToCloud(syncId, inheritors);
      }, 1500);
    }
  }, [inheritors, syncId]);

  // 5. 站点配置持久化
  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(siteConfig));
  }, [siteConfig]);

  const handleSaveInheritor = (data: Inheritor) => {
    const updatedData = { ...data, updatedAt: Date.now() };
    setInheritors(prev => {
      const index = prev.findIndex(i => i.id === data.id);
      if (index !== -1) {
        const newList = [...prev];
        newList[index] = updatedData;
        return newList;
      }
      return [updatedData, ...prev];
    });
    setEditingInheritor(null);
    setCurrentView('list');
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
                  syncStatus === 'syncing' ? 'bg-[#FF5000] animate-bounce' : 
                  syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                  {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Failed' : 'Local Archive'}
                </span>
                {syncId && <span className="text-[9px] text-gray-300 ml-2 font-mono">ID:{syncId}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 mr-6">
              {!syncId ? (
                <button onClick={createSyncRoom} className="text-[10px] font-black text-[#FF5000] uppercase tracking-widest hover:underline">开启云端同步</button>
              ) : (
                <button onClick={() => { if(confirm('退出同步将停止实时保存，确定吗？')) { window.history.replaceState({}, '', window.location.pathname); window.location.reload(); } }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">停止同步</button>
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
                {syncId && (
                  <div className="text-right pb-1">
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Last Cloud Update</p>
                    <p className="text-[10px] text-gray-900 font-mono">{new Date(lastSyncTime).toLocaleTimeString()}</p>
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-400 font-light max-w-2xl">
                已收录 <span className="text-gray-900 font-bold">{inheritors.length}</span> 位传承人。输入关键词或点击卡片浏览详尽资料。
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
                placeholder="搜索传承人姓名、头衔或作品工艺..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm outline-none transition-all duration-300 focus:ring-4 focus:ring-[#FF5000]/5 focus:border-[#FF5000] text-gray-700 placeholder-gray-300"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-4 flex items-center px-2 text-gray-300 hover:text-[#FF5000] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredInheritors.map(i => (
                <InheritorCard 
                  key={i.id} 
                  inheritor={i} 
                  onViewDetail={(id) => { setSelectedInheritorId(id); setCurrentView('detail'); }} 
                />
              ))}
              
              {!searchQuery && (
                <div 
                  className="group relative aspect-[4/5] rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center p-8 cursor-pointer hover:border-[#FF5000]/30 hover:bg-white transition-all duration-500"
                  onClick={() => { setEditingInheritor(null); setCurrentView('upload'); }}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-[#FF5000]/5 transition-colors">
                      <span className="text-3xl text-gray-200 group-hover:text-[#FF5000] transition-colors">+</span>
                  </div>
                  <p className="text-gray-300 group-hover:text-gray-500 font-bold text-[10px] uppercase tracking-widest text-center">录入新档案</p>
                </div>
              )}
            </div>

            {filteredInheritors.length === 0 && searchQuery && (
              <div className="py-32 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-400 serif">未找到匹配的传承档案</h3>
                <p className="text-sm text-gray-300 mt-2">请尝试搜索姓名、技艺类别或具体的作品名称</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-8 text-sm font-bold text-[#FF5000] hover:underline uppercase tracking-widest"
                >
                  清除搜索内容
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'detail' && selectedInheritorId && (
          <InheritorDetail 
            inheritor={inheritors.find(i => i.id === selectedInheritorId)!} 
            onBack={() => setCurrentView('list')} 
            onEdit={(i) => { setEditingInheritor(i); setCurrentView('upload'); }}
            onDelete={(id) => { if(confirm('确定永久删除该档案？此操作不可撤销。')) { setInheritors(prev => prev.filter(i => i.id !== id)); setCurrentView('list'); } }}
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
                        <span className="text-[10px] font-black text-[#FF5000] uppercase tracking-widest mr-3">Shared Archive ID</span>
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
                        <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">官方数字化阵地</h4>
                        <div className="flex items-start gap-8">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-[#FF5000] to-[#FF8000] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative w-32 h-32 bg-white p-2.5 rounded-[1.8rem] shadow-2xl flex items-center justify-center overflow-hidden">
                                    {/* 如果用户上传了自定义二维码，优先显示；否则按逻辑生成 */}
                                    <img 
                                      src={siteConfig.footerQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(syncId ? window.location.href : 'http://weixin.qq.com/r/mp/5REQCG3ETTAyrSlr90T3')}&color=121212`} 
                                      alt="二维码" 
                                      className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white tracking-wider">
                                      {siteConfig.footerQrCode ? '扫码查阅详情' : (syncId ? '扫码共享此档案' : '扫码关注 · 官方公众号')}
                                    </p>
                                    <p className="text-[10px] text-[#FF5000] font-black uppercase tracking-widest">
                                      {siteConfig.footerQrCode ? 'SCAN FOR INFO' : (syncId ? 'COLLABORATIVE ACCESS' : 'OFFICIAL WECHAT')}
                                    </p>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed font-light italic">
                                    {siteConfig.footerQrCode ? '扫描上方二维码\n获取更多非遗相关讯息\n数字化赋能匠心传承' : (syncId ? '使用另一台设备扫码\n即可实时查阅或共同编辑\n当前的所有传承人档案' : '扫描二维码进入快手公益官方平台\n了解更多非遗保护动态\n科技守护，匠心传承')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">© 2025 KUAISHOU CHARITY FOUNDATION. ALL HERITAGE RIGHTS RESERVED.</p>
                <div className="flex gap-8">
                    <button className="text-[10px] text-gray-700 hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</button>
                    <button className="text-[10px] text-gray-700 hover:text-white transition-colors uppercase tracking-widest">Digital Support</button>
                </div>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#FF5000]/5 to-transparent pointer-events-none skew-x-12 translate-x-1/4"></div>
      </footer>
    </div>
  );
};

export default App;
