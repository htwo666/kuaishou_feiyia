
import React, { useState, useRef } from 'react';
import { SiteConfig } from '../types';
import { Button } from './Button';

interface SiteConfigFormProps {
  config: SiteConfig;
  onSave: (config: SiteConfig) => void;
  onCancel: () => void;
}

export const SiteConfigForm: React.FC<SiteConfigFormProps> = ({ config, onSave, onCancel }) => {
  const [headerTitle, setHeaderTitle] = useState(config.headerTitle);
  const [headerSubtitle, setHeaderSubtitle] = useState(config.headerSubtitle);
  const [footerTitle, setFooterTitle] = useState(config.footerTitle);
  const [footerDescription, setFooterDescription] = useState(config.footerDescription);
  const [footerTags, setFooterTags] = useState(config.footerTags.join(', '));
  const [footerQrCode, setFooterQrCode] = useState(config.footerQrCode || '');

  const qrInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setFooterQrCode(base64);
      } catch (err) {
        console.error("QR Code upload error:", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      headerTitle,
      headerSubtitle,
      footerTitle,
      footerDescription,
      footerTags: footerTags.split(',').map(s => s.trim()).filter(Boolean),
      footerQrCode: footerQrCode || undefined
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] p-8 md:p-12 mb-20 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-12">
        <div>
            <h2 className="text-2xl font-black serif text-gray-900 mb-1">站点信息编辑</h2>
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.3em] uppercase">Site Configuration</p>
        </div>
        <button onClick={onCancel} className="text-gray-300 hover:text-gray-600 transition-colors text-2xl">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6">
          <h3 className="text-xs font-black text-[#FF5000] uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FF5000]/10 flex items-center justify-center text-[10px]">01</span>
              页首配置 (Header)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">主标题</label>
              <input 
                value={headerTitle} 
                onChange={e => setHeaderTitle(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50/50 border-b border-gray-100 rounded-xl focus:border-[#FF5000] focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">副标题 (Heritage Lab)</label>
              <input 
                value={headerSubtitle} 
                onChange={e => setHeaderSubtitle(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50/50 border-b border-gray-100 rounded-xl focus:border-[#FF5000] focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-10 border-t border-gray-100">
          <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[10px]">02</span>
              页尾配置 (Footer)
          </h3>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">页尾标题</label>
              <input 
                value={footerTitle} 
                onChange={e => setFooterTitle(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50/50 border-b border-gray-100 rounded-xl focus:border-[#FF5000] focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">品牌宣传语</label>
              <textarea 
                rows={3}
                value={footerDescription} 
                onChange={e => setFooterDescription(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50/50 border-b border-gray-100 rounded-xl focus:border-[#FF5000] focus:bg-white outline-none transition-all resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">服务标签 (逗号分隔)</label>
              <input 
                value={footerTags} 
                onChange={e => setFooterTags(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50/50 border-b border-gray-100 rounded-xl focus:border-[#FF5000] focus:bg-white outline-none transition-all"
                placeholder="数字化建档, 在线编辑, 传承人赋能"
              />
            </div>

            {/* 二维码编辑部分 */}
            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">页尾二维码更新</label>
              <div className="flex items-center gap-8">
                <div 
                  onClick={() => qrInputRef.current?.click()}
                  className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#FF5000] transition-all group relative"
                >
                  {footerQrCode ? (
                    <>
                      <img src={footerQrCode} className="w-full h-full object-contain" alt="QR Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[8px] text-white font-bold uppercase tracking-widest">更换二维码</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center px-4">
                      <span className="text-2xl text-gray-200 block mb-1">+</span>
                      <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">上传二维码</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                   <p className="text-[10px] text-gray-400 leading-relaxed italic">
                    提示：上传图片后将覆盖页尾默认的二维码。<br/>支持 JPG, PNG, WEBP。推荐尺寸 200x200px。
                   </p>
                   {footerQrCode && (
                     <button 
                       type="button" 
                       onClick={() => setFooterQrCode('')}
                       className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                     >
                       恢复默认二维码
                     </button>
                   )}
                </div>
                <input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={handleQrUpload} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 pt-10 border-t border-gray-50 justify-end">
          <Button variant="ghost" type="button" onClick={onCancel} className="text-gray-400 font-bold tracking-widest">取消</Button>
          <Button type="submit" className="px-10 !bg-[#FF5000] !hover:bg-[#E64800]">保存设置</Button>
        </div>
      </form>
    </div>
  );
};
