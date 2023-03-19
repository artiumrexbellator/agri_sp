import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import MenuContainer from './MenuContainer';
const { Header, Content, Footer } = Layout;
const { Title } = Typography;
import { Route, Routes } from 'react-router-dom';
import { BrowserRouter as Router } from 'react-router-dom';

import CreateCommodity from './CreateCommodity';
const titleStyle: React.CSSProperties = {
    color: 'white',
    marginTop: '10px'
}

const Home: React.FC = () => {
    const menuItems = [
        {
            title: 'Create commodity',
            link: 'createCommodity',
        },
        {
            title: 'Add a supplier',
            description: 'choose this option if you want to add supplies to you commodity',
            link: 'createCommodity',
        },
        {
            title: 'sell commodity',
            description: 'choose this option if you want to sell commodity to broker dealers which can be yourself too',
            link: 'createCommodity',
        }
    ];
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
                        <Route path="/" element={<MenuContainer menuItems={menuItems} />
                        } />

                        <Route path="/createCommodity" element={<CreateCommodity />
                        } />
                    </Routes>
                </Router>
            </Content>
            <Footer className="footer">Blockchain app for supply chain 2023</Footer>
        </Layout >
    );
};

export default Home;