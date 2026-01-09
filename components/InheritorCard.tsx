
import React from 'react';
import { Inheritor } from '../types';

interface InheritorCardProps {
  inheritor: Inheritor;
  onViewDetail: (id: string) => void;
}

export const InheritorCard: React.FC<InheritorCardProps> = ({ inheritor, onViewDetail }) => {
  const coverImage = inheritor.works[0]?.images[0] || 'https://picsum.photos/seed/bg/800/600';
  
  return (
    <div 
      onClick={() => onViewDetail(inheritor.id)}
      className="group relative bg-white rounded-[2.5rem] overflow-hidden p-3 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(255,80,0,0.15)] cursor-pointer flex flex-col h-full border border-gray-100/50"
    >
      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shrink-0">
        <img 
          src={coverImage} 
          alt="作品展示" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60"></div>
        
        {/* 头像浮层 */}
        <div className="absolute top-4 right-4">
            <div className="w-14 h-14 rounded-full border-2 border-white/50 overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white group-hover:scale-110">
                <img src={inheritor.avatar} className="w-full h-full object-cover" alt={inheritor.name} />
            </div>
        </div>

        <div className="absolute top-4 left-4">
            <span className="text-[9px] font-black tracking-widest text-white bg-[#FF5000] px-3 py-1 rounded-full uppercase shadow-lg">
              Collection
            </span>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
            <h3 className="text-2xl font-bold serif mb-1">{inheritor.name}</h3>
            <p className="text-[10px] font-light text-white/70 line-clamp-1 uppercase tracking-widest">{inheritor.skillAndLevel}</p>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Primary Craft</p>
                <p className="text-sm font-bold text-[#FF5000] serif">{inheritor.works[0]?.technique || '传统非遗'}</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-[#FF5000] group-hover:bg-[#FF5000] group-hover:text-white transition-all duration-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
             {/* Fix: changed 'inheritors' to 'inheritor' to correctly access works property on the prop */}
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{inheritor.works.length > 0 ? `Archives 0${inheritor.works.length}` : 'New'}</span>
             <div className="flex -space-x-3">
                {inheritor.works.slice(0, 3).map((w, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm">
                        <img src={w.images[0]} className="w-full h-full object-cover" />
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};
