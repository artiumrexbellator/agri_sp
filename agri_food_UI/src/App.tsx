import React from 'react';
import Home from './components/Home';
import 'antd/dist/reset.css';
import './theme.css'
const App: React.FC = () => {
    return (
        <div className='app'>
            <Home />
        </div>
    )
}


export default App;