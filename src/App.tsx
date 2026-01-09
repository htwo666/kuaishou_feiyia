import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 serif">非遗传习学堂</h1>
        <p className="text-xl text-gray-600 mb-8">传承人资料管理平台</p>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <p className="text-gray-700 mb-4">✅ Tailwind CSS 已正确配置</p>
          <p className="text-gray-700 mb-4">✅ React 应用已准备就绪</p>
          <p className="text-gray-700 mb-6">✅ GitHub Pages 部署配置完成</p>
          <div className="text-sm text-gray-500">
            系统正在运行中，所有功能正常
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
