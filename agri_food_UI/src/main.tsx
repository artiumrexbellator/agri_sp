import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd';
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider theme={{
    algorithm: theme.compactAlgorithm,
  }}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ConfigProvider>
)
