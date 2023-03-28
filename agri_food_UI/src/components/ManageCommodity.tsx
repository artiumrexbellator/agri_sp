import HomeButton from "./HomeButton";
import React, { useState } from 'react';
import { Button, Space, Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface DataType {
    origin: string;
    type: string;
}



const ManageCommodity: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const columns: ColumnsType<DataType> = [
        {
            title: 'origin',
            dataIndex: 'origin',
            key: 'origin',
            render: (text) => <a>{text}</a>,
        },
        {
            title: 'type',
            dataIndex: 'type',
            key: 'type',
        },

        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" onClick={() => {
                        setModalOpen(true);
                    }}>Issue an agreement</Button>
                </Space>
            ),
        },
    ];

    const data: DataType[] = [
        {
            origin: '1',
            type: 'John Brown',

        },
        {
            origin: '1',
            type: 'John Brown',

        }
    ];

    return (
        <div className='content'>
            <HomeButton />
            <Table columns={columns} dataSource={data} />
            <Modal
                title="20px to Top"
                centered
                open={modalOpen}
                onOk={() => setModalOpen(false)}
                onCancel={() => setModalOpen(false)}
            >
                <p>some contents...</p>

            </Modal>
        </div>
    )
}

export default ManageCommodity