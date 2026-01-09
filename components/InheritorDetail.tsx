
import React from 'react';
import { Inheritor } from '../types';
import { Button } from './Button';

interface InheritorDetailProps {
  inheritor: Inheritor;
  onBack: () => void;
  onEdit: (inheritor: Inheritor) => void;
  onDelete: (id: string) => void;
}

export const InheritorDetail: React.FC<InheritorDetailProps> = ({ inheritor, onBack, onEdit, onDelete }) => {
  return (
    <div className="max-w-6xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* 顶部导航 */}
      <div className="flex justify-between items-center mb-16">
        <button 
          onClick={onBack}
          className="group flex items-center gap-4 text-sm font-semibold text-gray-400 hover:text-[#C04851] transition-colors"
        >
          <span className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#C04851] transition-all">←</span>
          返回馆藏
        </button>
        <div className="flex gap-4">
            <Button variant="ghost" onClick={() => onEdit(inheritor)}>编辑</Button>
            <Button variant="outline" className="text-xs px-4" onClick={() => onDelete(inheritor.id)}>下架档案</Button>
        </div>
      </div>

      {/* 核心人物档案卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-32 items-center">
        <div className="lg:col-span-5 relative">
            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                <img src={inheritor.avatar} className="w-full h-full object-cover" alt={inheritor.name} />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[3rem]"></div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#C04851]/5 rounded-full blur-3xl -z-10"></div>
        </div>

        <div className="lg:col-span-7 space-y-10">
            <div>
                <span className="text-xs font-black text-[#C04851] uppercase tracking-[0.5em] mb-4 block">National Heritage Master</span>
                <h1 className="text-6xl md:text-8xl font-black serif text-gray-900 leading-tight mb-6">{inheritor.name}</h1>
                <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed serif italic">
                    {inheritor.skillAndLevel}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-10 pt-10 border-t border-gray-100">
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">联系方式</p>
                    <p className="text-lg font-semibold text-gray-800 tracking-tighter">{inheritor.contact}</p>
                </div>
            </div>
        </div>
      </div>

      {/* 经历部分 */}
      <div className="mb-40">
        <div className="flex flex-col md:flex-row gap-20">
            <div className="md:w-1/3">
                <h2 className="text-4xl font-bold serif sticky top-32">艺术历程<br/><span className="text-[#C04851]">Biography</span></h2>
            </div>
            <div className="md:w-2/3 space-y-16">
                {inheritor.bio.experience.map((exp, i) => (
                    <div key={i} className="relative pl-12 group">
                        <div className="absolute left-0 top-0 w-px h-full bg-gray-100 group-hover:bg-[#C04851] transition-colors"></div>
                        <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-white border-2 border-gray-200 group-hover:border-[#C04851] transition-all"></div>
                        <p className="text-xl text-gray-600 leading-[1.8] font-light">{exp}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 作品展示 */}
      <div className="space-y-32">
        <div className="text-center space-y-4">
            <p className="text-[#C5A059] font-black text-[10px] uppercase tracking-[0.6em]">The Masterpiece Gallery</p>
            <h2 className="text-5xl font-black serif">匠心造物 · 传世经典</h2>
        </div>

        <div className="space-y-40">
            {inheritor.works.map((work, idx) => (
                <div key={work.id} className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-20 items-center`}>
                    <div className="lg:w-3/5 group">
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl bg-gray-100 aspect-[16/10]">
                            {work.videoUrl ? (
                                <video 
                                  src={work.videoUrl} 
                                  className="w-full h-full object-cover" 
                                  controls 
                                  poster={work.images[0]} 
                                />
                            ) : (
                                <img src={work.images[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            )}
                        </div>
                        {work.images.length > 1 && (
                            <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar py-2">
                                {work.images.map((img, i) => (
                                    <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 cursor-pointer border-2 border-transparent hover:border-[#C04851] transition-all">
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="lg:w-2/5 space-y-8">
                        <div>
                            <span className="text-[#C04851] font-bold serif italic text-3xl mb-4 block">0{idx + 1}</span>
                            <h3 className="text-4xl font-bold serif text-gray-900 mb-2">{work.name}</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{work.technique}</p>
                        </div>
                        
                        <div className="space-y-6 text-gray-500 leading-relaxed text-lg font-light">
                            <p className="italic underline decoration-[#C5A059]/30 underline-offset-8">“ {work.concept} ”</p>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div className="border-l-2 border-gray-100 pl-4 py-1">
                                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">制作周期</span>
                                    <span className="font-semibold text-gray-800">{work.cycle}</span>
                                </div>
                                <div className="border-l-2 border-gray-100 pl-4 py-1">
                                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">市场估价</span>
                                    <span className="font-bold text-[#C04851]">¥{work.price}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
