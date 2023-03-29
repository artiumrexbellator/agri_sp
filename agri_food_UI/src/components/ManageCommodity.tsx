import HomeButton from "./HomeButton";
import React, { useState, useEffect } from 'react';
import { Button, Space, Table, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from "axios";
import { server } from "../axios/axios";

interface DataType {
    key: string,
    origin: string;
    type: string;
}



const ManageCommodity: React.FC = () => {
    useEffect(() => {
        try {
            axios.get(`${server}/api/get/commodity`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    message.success({ content: 'commodity is added successfully' })
                } else {
                    message.error({ content: 'internal error' })
                }
            });
        } catch (err) {
            console.log(err);
        }
    }, [])
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
            key: '1',
            origin: '1',
            type: 'John Brown',

        },
        {
            key: '2',
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