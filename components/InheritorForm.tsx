
import React, { useState, useEffect, useRef } from 'react';
import { Inheritor, Work } from '../types';
import { Button } from './Button';

interface InheritorFormProps {
  onSave: (inheritor: Inheritor) => void;
  onCancel: () => void;
  initialData?: Inheritor | null;
}

export const InheritorForm: React.FC<InheritorFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [contact, setContact] = useState('');
  const [skillAndLevel, setSkillAndLevel] = useState('');
  const [bioExp, setBioExp] = useState('');
  const [awards, setAwards] = useState<string[]>([]);
  const [works, setWorks] = useState<Partial<Work>[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAvatar(initialData.avatar || '');
      setContact(initialData.contact);
      setSkillAndLevel(initialData.skillAndLevel);
      setBioExp(initialData.bio.experience.join('\n'));
      setAwards(initialData.bio.awards || []);
      // 深拷贝作品数据
      setWorks(JSON.parse(JSON.stringify(initialData.works)));
    } else {
      // 彻底重置所有字段，防止旧数据残留
      setName('');
      setAvatar('');
      setContact('');
      setSkillAndLevel('');
      setBioExp('');
      setAwards([]);
      setWorks([{ 
        id: `new-${Date.now()}`, 
        name: '', 
        technique: '', 
        cycle: '', 
        dimensions: '', 
        concept: '', 
        socialSignificance: '', 
        price: '', 
        images: [], 
        videoUrl: '' 
      }]);
    }
  }, [initialData]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setAvatar(base64);
    }
  };

  const handleWorkImagesUpload = async (workIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const base64s = await Promise.all(files.map(file => fileToBase64(file)));
      const currentImages = works[workIndex].images || [];
      updateWorkField(workIndex, 'images', [...currentImages, ...base64s]);
    }
  };

  const handleWorkVideoUpload = async (workIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert("视频文件过大，请上传15MB以内的视频。");
        return;
      }
      const base64 = await fileToBase64(file);
      updateWorkField(workIndex, 'videoUrl', base64);
    }
  };

  const addWork = () => {
    setWorks(prev => [...prev, { 
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      name: '', 
      technique: '', 
      cycle: '', 
      dimensions: '', 
      concept: '', 
      socialSignificance: '', 
      price: '', 
      images: [], 
      videoUrl: '' 
    }]);
  };

  const removeWork = (index: number) => {
    if (works.length <= 1) {
      alert("请至少保留一份代表作品。");
      return;
    }
    setWorks(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorkField = (index: number, field: keyof Work, value: any) => {
    setWorks(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  const removeWorkImage = (workIdx: number, imgIdx: number) => {
    const currentImages = [...(works[workIdx].images || [])];
    currentImages.splice(imgIdx, 1);
    updateWorkField(workIdx, 'images', currentImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("请输入传承人姓名。");
      return;
    }
    
    // 构建纯净的数据负载
    const payload: Inheritor = {
      id: initialData ? initialData.id : Date.now().toString(),
      name: name.trim(),
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      contact: contact.trim(),
      skillAndLevel: skillAndLevel.trim(),
      bio: { 
        experience: bioExp.split('\n').map(s => s.trim()).filter(Boolean), 
        awards: awards 
      },
      works: works.map(w => ({
        ...w, 
        id: w.id && !w.id.startsWith('new') ? w.id : `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: (w.name || '未命名作品').trim(),
        images: w.images && w.images.length > 0 ? w.images : [`https://picsum.photos/seed/${Math.random()}/800/600`]
      })) as Work[]
    };
    
    onSave(payload);
  };

  const InputClass = "w-full bg-gray-50/50 border-b-[1.5px] border-gray-200 px-4 py-3 outline-none focus:border-[#FF5000] focus:bg-white transition-all duration-300 text-sm";

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] p-8 md:p-12 mb-20 border border-gray-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center mb-16">
        <div>
            <h2 className="text-3xl md:text-4xl font-black serif text-gray-900 mb-2">
              {initialData ? '修缮档案' : '录入非遗档案'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.3em] uppercase">Digital Archive Collection</p>
        </div>
        <button onClick={onCancel} className="w-12 h-12 rounded-full hover:bg-gray-50 text-gray-300 hover:text-gray-900 transition-all flex items-center justify-center text-2xl font-light">×</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-20">
        <section className="space-y-10">
          <header className="flex items-center gap-4">
              <span className="w-10 h-10 rounded-full bg-[#FF5000]/10 text-[#FF5000] flex items-center justify-center font-black text-xs tracking-tighter">01</span>
              <h3 className="text-xl font-bold serif text-gray-800 tracking-tight">传承人主档案</h3>
          </header>
          
          <div className="flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/3">
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative aspect-square rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-[#FF5000]/50 transition-all"
                >
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300 text-center px-4">
                            <span className="text-4xl mb-2">✦</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">点击上传<br/>传承人个人照</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-[#FF5000]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold tracking-widest uppercase">更换照片</span>
                    </div>
                </div>
                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">传承人姓名</label>
                        <input required value={name} onChange={e => setName(e.target.value)} className={InputClass} placeholder="输入实名" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">联系电话</label>
                        <input required value={contact} onChange={e => setContact(e.target.value)} className={InputClass} placeholder="11位手机号" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">官方头衔及级别</label>
                    <input required value={skillAndLevel} onChange={e => setSkillAndLevel(e.target.value)} className={InputClass} placeholder="XX项目国家级代表性传承人" />
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">艺术成就及从业经历</label>
            <textarea rows={5} value={bioExp} onChange={e => setBioExp(e.target.value)} className={`${InputClass} resize-none leading-relaxed`} placeholder="每一行代表一段关键经历..." />
          </div>
        </section>

        <section className="space-y-10">
          <header className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center font-black text-xs tracking-tighter">02</span>
                  <h3 className="text-xl font-bold serif text-gray-800 tracking-tight">代表作品集</h3>
              </div>
              <Button variant="ghost" type="button" className="text-[10px] px-4 font-black" onClick={addWork}>+ 增补作品</Button>
          </header>

          <div className="space-y-16">
            {works.map((work, idx) => (
              <div key={work.id} className="p-8 md:p-10 bg-gray-50/50 rounded-[2.5rem] border border-gray-100/50 relative group/card">
                <button 
                  type="button"
                  onClick={() => removeWork(idx)}
                  className="absolute top-6 right-8 text-[10px] font-black text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  移除此作品
                </button>

                <div className="flex items-center gap-6 mb-10">
                    <span className="text-3xl font-black serif italic text-[#C5A059] opacity-30">0{idx + 1}</span>
                    <input 
                      required
                      placeholder="作品正式命名" 
                      className="flex-1 bg-transparent border-b border-gray-200 py-2 text-xl md:text-2xl font-bold serif outline-none focus:border-[#FF5000] transition-all"
                      value={work.name}
                      onChange={e => updateWorkField(idx, 'name', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">上传作品照片 (多选)</label>
                        <div className="grid grid-cols-3 gap-3">
                        {work.images?.map((img, i) => (
                            <div key={i} className="group/img relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => removeWorkImage(idx, i)}
                                className="absolute inset-0 bg-red-500/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                            >
                                移除
                            </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5000] transition-all bg-white group/btn">
                            <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleWorkImagesUpload(idx, e)} />
                            <span className="text-gray-300 text-2xl font-light group-hover/btn:text-[#FF5000]">+</span>
                            <span className="text-[8px] text-gray-300 font-bold group-hover/btn:text-[#FF5000]">添加照片</span>
                        </label>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">上传演示视频 (选填)</label>
                        <div className="relative">
                            {work.videoUrl ? (
                                <div className="rounded-2xl overflow-hidden aspect-video bg-black relative group/vid">
                                    <video src={work.videoUrl} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/vid:opacity-100 transition-all flex items-center justify-center gap-4">
                                        <label className="cursor-pointer bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-[10px] hover:bg-white/40 transition-all font-bold">
                                            更换
                                            <input type="file" accept="video/*" className="hidden" onChange={e => handleWorkVideoUpload(idx, e)} />
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={() => updateWorkField(idx, 'videoUrl', '')}
                                            className="bg-red-500/60 backdrop-blur text-white px-4 py-2 rounded-full text-[10px] hover:bg-red-500 transition-all font-bold"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF5000] transition-all bg-white group/vidbtn">
                                    <input type="file" accept="video/*" className="hidden" onChange={e => handleWorkVideoUpload(idx, e)} />
                                    <span className="text-3xl text-gray-200 mb-2 group-hover/vidbtn:text-[#FF5000] scale-150">▶</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover/vidbtn:text-[#FF5000]">Upload Work Video</span>
                                </label>
                            )}
                        </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-300 uppercase">非遗技艺</label>
                          <input value={work.technique} onChange={e => updateWorkField(idx, 'technique', e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5 text-xs outline-none border border-gray-100 focus:border-[#C5A059]" placeholder="例如：烙画" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-300 uppercase">预估价格</label>
                          <input value={work.price} onChange={e => updateWorkField(idx, 'price', e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5 text-xs outline-none border border-gray-100 focus:border-[#C5A059]" placeholder="例如：120元" />
                      </div>
                      <div className="col-span-2">
                         <label className="text-[10px] font-bold text-gray-300 uppercase">创作理念与文化寓意</label>
                         <textarea rows={4} value={work.concept} onChange={e => updateWorkField(idx, 'concept', e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5 text-xs outline-none border border-gray-100 focus:border-[#C5A059] resize-none leading-relaxed" placeholder="描述作品背后的故事、文化内涵或制作心路历程..." />
                      </div>
                      <div className="col-span-2">
                         <label className="text-[10px] font-bold text-gray-300 uppercase">社会意义/经济价值</label>
                         <textarea rows={3} value={work.socialSignificance} onChange={e => updateWorkField(idx, 'socialSignificance', e.target.value)} className="w-full bg-white rounded-xl px-4 py-2.5 text-xs outline-none border border-gray-100 focus:border-[#C5A059] resize-none leading-relaxed" placeholder="如：带动多少村民就业、单品年销售额、参加过哪些展会等..." />
                      </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-6 pt-16 border-t border-gray-100 justify-end">
          <Button variant="ghost" type="button" onClick={onCancel} className="text-gray-400 font-bold tracking-widest uppercase">舍弃更改</Button>
          <Button type="submit" className="px-16 py-4 !bg-[#FF5000] !hover:bg-[#E64800] shadow-xl">封存入库</Button>
        </div>
      </form>
    </div>
  );
};
