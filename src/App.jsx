import React from 'react'

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ color: '#FF5000', fontSize: '3rem', marginBottom: '1rem' }}>
          非遗传习学堂
        </h1>
        <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '2rem' }}>
          传承人资料管理平台
        </p>
        
        <div style={{
          background: '#f0f9ff',
          padding: '15px',
          borderRadius: '10px',
          margin: '10px 0',
          textAlign: 'left'
        }}>
          <p style={{ color: '#10b981' }}>✅ GitHub Pages 部署成功</p>
          <p style={{ color: '#10b981' }}>✅ 网站可正常访问</p>
          <p style={{ color: '#10b981' }}>✅ React 应用已加载</p>
        </div>
        
        <div style={{ marginTop: '30px', fontSize: '14px', color: '#888' }}>
          <p>访问地址：https://htwo666.github.io/kuaishou_feiyia/</p>
          <p>© 2025 快手公益基金会 - 非遗数字化保护项目</p>
        </div>
      </div>
    </div>
  )
}

export default App
