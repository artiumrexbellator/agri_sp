import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography } from 'antd';
import MenuContainer from './MenuContainer';
import ManageCommodity from './ManageCommodity';
import Connect from './connect';
const { Header, Content, Footer } = Layout;
const { Title } = Typography;
import { Route, Routes } from 'react-router-dom';
import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import CreateCommodity from './CreateCommodity';
import axios from 'axios';
import { server } from '../axios/axios';
const titleStyle: React.CSSProperties = {
    color: 'white',
    marginTop: '10px'
}

const Home: React.FC = () => {
    const [token, setToken] = useState(null);
    useEffect(() => {
        const fetchToken = async () => {
            await axios.get(`${server}/api/cookie`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    setToken(response.data)
                    console.log(token)
                }
            });
        }
        fetchToken()
    }, [])
    const menuItems = [
        {
            title: 'Create commodity',
            link: 'createCommodity',
        },
        {
            title: 'manage Commodity',
            description: 'You can view you commmodities and issue keys for suppliers',
            link: 'manageCommodity',
        },
        {
            title: 'sell commodity',
            description: 'choose this option if you want to sell commodity to broker dealers which can be yourself too',
            link: '',
        }
    ];

    // If user is not authenticated, navigate to login page
    return (
        <Layout className="layout">
            <Header className="header">
                <Title level={2} italic style={titleStyle}>Agrifood blockchain</Title>
                <div className="logo" />
                <Menu
                    mode="horizontal"
                />
            </Header>
            <Content className="content">
                <Router>
                    <Routes>
                        <Route path="/login" element={<Connect />
                        } />
                        <Route path="/" element={token ? <MenuContainer menuItems={menuItems} /> : <Navigate to="/login" />
                        } />

                        <Route path="/createCommodity" element={token ? <CreateCommodity /> : <Navigate to="/login" />
                        } />
                        <Route path="/manageCommodity" element={token ? <ManageCommodity /> : <Navigate to="/login" />
                        } />
                    </Routes>
                </Router>
            </Content>
            <Footer className="footer">Blockchain app for supply chain 2023</Footer>
        </Layout >
    );
};

export default Home;