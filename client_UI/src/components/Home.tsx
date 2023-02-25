import React from 'react';
import { Row, Col, Layout, Menu, theme, Card } from 'antd';
import type { MenuProps, MenuTheme } from 'antd';
import MenuItem from 'antd/es/menu/MenuItem';
import { CarryOutOutlined } from '@ant-design/icons'

const { Header, Content, Footer } = Layout;

const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: '120px',
    minHeight: '82vh',
    color: 'black',
    backgroundColor: 'white',
    padding: '70px 20px',

};
const cardStyle: React.CSSProperties = {
    height: '30vh',
    width: '30vh',
}
type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    theme?: 'light' | 'dark',
): MenuItem {
    return {
        label,
        theme
    } as MenuItem;
}
const Home: React.FC = () => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();
    const items: MenuItem[] = [
        getItem(
            'Welcome to the blockchain UI to interact with the network'
        )
    ];
    return (
        <Layout className="layout">
            <Header>
                <div className="logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={items}

                />
            </Header>
            <Content style={contentStyle}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Row gutter={[12, 12]}>
                        <Col span={12}>
                            <Card style={cardStyle} hoverable={true}></Card>
                        </Col>
                        <Col span={12}>
                            <Card style={cardStyle} hoverable={true}><CarryOutOutlined />
                                track your goods</Card>
                        </Col>
                    </Row>
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>Blockchain app for supply chain 2023</Footer>
        </Layout >
    );
};

export default Home;