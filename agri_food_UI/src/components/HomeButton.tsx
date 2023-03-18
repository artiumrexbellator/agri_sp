import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const HomeButton = () => {
    return (
        <Link to="/">

            <Button
                type="primary"
                shape="circle"
                icon={<HomeOutlined style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} />}
                style={{
                    position: 'fixed',
                    bottom: "50%",
                    right: 20,
                    zIndex: 9999,
                    fontSize: "20px",
                    width: '60px',
                    height: '60px',

                }}
            />
        </Link>
    );
};

export default HomeButton