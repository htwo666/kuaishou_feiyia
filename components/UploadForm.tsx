
import React, { useState } from 'react';
import { Inheritor, Work } from '../types';
import { Button } from './Button';

interface UploadFormProps {
  onSave: (inheritor: Inheritor) => void;
  onCancel: () => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [skillAndLevel, setSkillAndLevel] = useState('');
  const [bioExp, setBioExp] = useState('');
  const [works, setWorks] = useState<Partial<Work>[]>([
    { id: 'new-1', name: '', technique: '', cycle: '', dimensions: '', concept: '', socialSignificance: '', price: '', images: [] }
  ]);

  const addWork = () => {
    setWorks([...works, { id: `new-${Date.now()}`, name: '', technique: '', cycle: '', dimensions: '', concept: '', socialSignificance: '', price: '', images: [] }]);
  };

  const updateWork = (index: number, field: keyof Work, value: string) => {
    const newWorks = [...works];
    newWorks[index] = { ...newWorks[index], [field]: value };
    setWorks(newWorks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInheritor: Inheritor = {
      id: Date.now().toString(),
      name,
      contact,
      skillAndLevel,
      bio: {
        experience: bioExp.split('\n').filter(s => s.trim()),
        awards: []
      },
      works: works.map(w => ({
        ...w,
        id: w.id || Math.random().toString(),
        images: ['https://picsum.photos/seed/' + Math.random() + '/800/600']
      })) as Work[]
    };
    onSave(newInheritor);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 serif border-l-4 border-[#C04851] pl-4">资料征集</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#C04851] text-white rounded-full flex items-center justify-center text-xs">1</span>
            基本信息
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">姓名</label>
              <input 
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C04851]/20 focus:border-[#C04851] outline-none"
                placeholder="请输入传承人姓名"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">联系方式</label>
              <input 
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C04851]/20 focus:border-[#C04851] outline-none"
                placeholder="手机号或邮箱"
                value={contact}
                onChange={e => setContact(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">传承技艺及级别</label>
            <input 
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C04851]/20 focus:border-[#C04851] outline-none"
              placeholder="例如：XX省XX市非物质文化遗产项目代表性传承人"
              value={skillAndLevel}
              onChange={e => setSkillAndLevel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">个人简介 (从业经历/活动/奖项)</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C04851]/20 focus:border-[#C04851] outline-none"
              placeholder="请分行输入您的主要经历..."
              value={bioExp}
              onChange={e => setBioExp(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#C04851] text-white rounded-full flex items-center justify-center text-xs">2</span>
              作品展示
            </h3>
            <button type="button" onClick={addWork} className="text-[#C04851] text-sm font-medium hover:underline">+ 添加另一件作品</button>
          </div>

          {works.map((work, idx) => (
            <div key={work.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-[#C04851] text-white text-xs rounded-full">作品 {idx + 1}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <input 
                  required
                  placeholder="作品名称" 
                  className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                  value={work.name}
                  onChange={e => updateWork(idx, 'name', e.target.value)}
                />
                <input 
                  placeholder="非遗技艺" 
                  className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                  value={work.technique}
                  onChange={e => updateWork(idx, 'technique', e.target.value)}
                />
                <input 
                  placeholder="创作周期 (如: 3天)" 
                  className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                  value={work.cycle}
                  onChange={e => updateWork(idx, 'cycle', e.target.value)}
                />
                <input 
                  placeholder="尺寸与重量" 
                  className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                  value={work.dimensions}
                  onChange={e => updateWork(idx, 'dimensions', e.target.value)}
                />
                <input 
                  placeholder="价格 (元)" 
                  className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                  value={work.price}
                  onChange={e => updateWork(idx, 'price', e.target.value)}
                />
                 <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 text-center text-sm text-gray-500 hover:border-[#C04851] transition-colors">
                        点击上传作品图片
                        <input type="file" className="hidden" multiple />
                    </label>
                 </div>
              </div>
              <textarea 
                placeholder="创作理念 (视觉风格/功能/寓意)" 
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                value={work.concept}
                onChange={e => updateWork(idx, 'concept', e.target.value)}
              />
              <textarea 
                placeholder="社会意义 (带动就业/文化传播)" 
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#C04851]"
                value={work.socialSignificance}
                onChange={e => updateWork(idx, 'socialSignificance', e.target.value)}
              />
            </div>
          ))}
        </section>

        <div className="flex gap-4 pt-6 justify-end">
          <Button variant="outline" type="button" onClick={onCancel}>取消</Button>
          <Button type="submit">提交材料</Button>
        </div>
      </form>
    </div>
  );
};
