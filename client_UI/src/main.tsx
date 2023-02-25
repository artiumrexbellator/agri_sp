import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd';
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ConfigProvider>
)
