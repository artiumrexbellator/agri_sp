import React from 'react';
import { Card } from 'antd'
import { Link } from 'react-router-dom';
import HomeButton from './HomeButton';

interface MenuItem {
    title: string;
    link: string;
    description?: string;
}

interface MenuProps {
    menuItems: MenuItem[];
}

const MenuContainer: React.FC<MenuProps> = ({ menuItems }) => {
    return (
        <div className="menu-container">
            <HomeButton />
            {menuItems.map((menuItem, index) => (
                <Link to={menuItem.link}>
                    <Card
                        hoverable
                        className="menu-card"
                        key={index}
                    >
                        <Card.Meta title={menuItem.title} description={menuItem.description} />
                    </Card>
                </Link>
            ))}
        </div>
    )
}

export default MenuContainer