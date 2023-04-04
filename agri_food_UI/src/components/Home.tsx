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
import ManageAgreements from './ManageAgreements';
import PushSupplies from './PushSupplies';
import CommodityFraction from './broker/CommodityFraction';
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
                }
            });
        }
        fetchToken()
    }, [])
    const menuItems = [
        {
            key: 1,
            title: 'Create commodity',
            link: 'createCommodity',
        },
        {
            key: 2,
            title: 'manage Commodity',
            description: 'You can view you commmodities and issue keys for suppliers',
            link: 'manageCommodity',
        },
        {
            key: 3,
            title: 'manage agreements',
            description: 'view all the agreements you issued for a specific commodity',
            link: 'manageAgreements',
        }, {
            key: 4,
            title: 'add supplies to a commodity',
            description: 'you can add supplies to a specific commodity by providing necessary and valid identities',
            link: 'createSupply',
        }, {
            key: 5,
            title: 'Create commodity fraction',
            description: 'to create a commodity fraction you should provide necessary and valid identities',
            link: 'createCommodityFraction',
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
                        <Route path="/login" element={token ? <Navigate to="/" /> : <Connect />
                        } />
                        <Route path="/" element={token ? <MenuContainer menuItems={menuItems} /> : <Navigate to="/login" />
                        } />

                        <Route path="/createCommodity" element={token ? <CreateCommodity /> : <Navigate to="/login" />
                        } />
                        <Route path="/manageCommodity" element={token ? <ManageCommodity /> : <Navigate to="/login" />
                        } />
                        <Route path="/manageAgreements" element={token ? <ManageAgreements /> : <Navigate to="/login" />
                        } />
                        <Route path="/createSupply" element={token ? <PushSupplies /> : <Navigate to="/login" />
                        } />
                        <Route path="/createCommodityFraction" element={token ? <CommodityFraction /> : <Navigate to="/login" />
                        } />
                    </Routes>
                </Router>
            </Content>
            <Footer className="footer">Blockchain app for supply chain 2023</Footer>
        </Layout >
    );
};

export default Home;