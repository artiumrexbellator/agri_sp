import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout, Menu, Typography } from 'antd';
import MenuContainer from './MenuContainer';
import ManageCommodity from './farmer/ManageCommodity';
import Connect from './connect';
const { Header, Content, Footer } = Layout;
const { Title } = Typography;
import { Route, Routes } from 'react-router-dom';
import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import CreateCommodity from './farmer/CreateCommodity';
import axios from 'axios';
import { server } from '../axios/axios';
import ManageAgreements from './ManageAgreements';
import PushSupplies from './supplier/PushSupplies';
import CommodityFraction from './broker/CommodityFraction';
import ManageFractions from './broker/ManageFractions';
import LotUnit from './factory/LotUnit';
import ScanPackage from './factory/ScanPackage';
import Package from './retailer/Package';

const TimeLine = lazy(() => import('./retailer/TimeLine'));


const titleStyle: React.CSSProperties = {
    color: 'white',
    marginTop: '10px'
}
interface Roles {
    [key: string]: number[];
}
const Home: React.FC = () => {
    const [token, setToken] = useState(null);
    const [msp, setMsp] = useState<string | null>(null);
    useEffect(() => {
        const fetchToken = async () => {
            await axios.get(`${server}/api/cookie`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    setToken(response.data)
                    axios.get(`${server}/api/msp`, { withCredentials: true }).then(response => {
                        if (response.status == 200) {
                            setMsp(response.data)
                        }
                    });
                }
            });
        }
        fetchToken()
    }, [])
    const roles: Roles = {
        FarmerMSP: [1, 2, 3, 5, 6],
        SupplierMSP: [4],
        BrokerMSP: [3, 5, 6],
        FactoryMSP: [7, 8],
        DistributorMSP: [8],
        WholesalerMSP: [8],
        RetailerMSP: [8, 9],
    }
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
        }, {
            key: 6,
            title: 'Manage commodity fraction',
            description: 'you can view for each of your own commodity fractions,the fraction and its associated commodity',
            link: 'manageCommodityFraction',
        }, {
            key: 7,
            title: 'Create the lot unit',
            description: 'this window will allow you to create a lotUnit for each commodity fraction that is currently processed by the factory in production chain',
            link: 'createLotUnit',
        }, {
            key: 8,
            title: 'Scan packages',
            description: 'you can scan packages by first picking up the right lot unit they belong to.Every scanned package is added/modified to/in the blockchain',
            link: 'scanPackage',
        }, {
            key: 9,
            title: 'get package',
            description: 'scan your package to get full informations about its road to you hands',
            link: 'getPackage',
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
                        <Route path="/" element={token ? <MenuContainer menuItems={!!msp ? menuItems.filter(item => roles[msp].includes(item.key)) : []} /> : <Navigate to="/login" />
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
                        <Route path="/manageCommodityFraction" element={token ? <ManageFractions /> : <Navigate to="/login" />
                        } />
                        <Route path="/createLotUnit" element={token ? <LotUnit /> : <Navigate to="/login" />
                        } />
                        <Route path="/scanPackage" element={token ? <ScanPackage /> : <Navigate to="/login" />
                        } />
                        <Route path="/getPackage" element={token ? <Package /> : <Navigate to="/login" />
                        } />
                        <Route path="/timeLine" element={token ? <Suspense fallback={<div>Loading...</div>}><TimeLine /></Suspense> : <Navigate to="/login" />
                        } />
                    </Routes>
                </Router>
            </Content>
            <Footer className="footer">Blockchain app for supply chain 2023</Footer>
        </Layout >
    );
};

export default Home;