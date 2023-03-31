import HomeButton from "./HomeButton";
import React, { useState, useEffect } from 'react';
import { Button, Space, Table, Popconfirm, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import axios from "axios";
import { server } from "../axios/axios";

interface DataType {
    id: string,
    origin: string;
    type: string;
    create_date: string;
}

interface TableParams {
    pagination?: TablePaginationConfig;
    sortField?: string;
    sortOrder?: string;
    filters?: Record<string, FilterValue>;
}


const ManageCommodity: React.FC = () => {

    const [confirmStates, setConfirmStates] = useState<{ [key: string]: boolean }>({});
    const [confirmLoading, setConfirmLoading] = useState({});
    const [data, setData] = useState<DataType[]>();
    const [loading, setLoading] = useState(false);
    const [tableParams, setTableParams] = useState<TableParams>({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });
    const columns: ColumnsType<DataType> = [
        {
            title: 'Origin',
            dataIndex: 'origin',
            sorter: true,
        },
        {
            title: 'Type',
            dataIndex: 'type',
        }, {
            title: 'Created at',
            dataIndex: 'create_date',
        }
        , {
            title: 'Action',
            render: (text, record) => {

                const showPopconfirm = (id: string) => {
                    setConfirmStates(prevStates => {
                        return {
                            ...prevStates,
                            [id]: true
                        }
                    });
                };

                const handleOk = (id: string) => {
                    setConfirmLoading(true);

                    setTimeout(() => {
                        setConfirmStates(prevStates => {
                            return {
                                ...prevStates,
                                [id]: false
                            }
                        });
                        setConfirmLoading(false);
                    }, 2000);
                };

                const handleCancel = (id: string) => {
                    console.log('Clicked cancel button');
                    setConfirmStates(prevStates => {
                        return {
                            ...prevStates,
                            [id]: false
                        }
                    });
                };

                return (
                    <Space size="middle">
                        <Popconfirm
                            title="Title"
                            description={`Do you want to create an agreement for the commodity ${record.id}?`}
                            open={confirmStates[record.id] || false}
                            onConfirm={() => handleOk(record.id)}
                            okButtonProps={{ loading: confirmLoading }}
                            onCancel={() => handleCancel(record.id)}
                        >
                            <Button type="primary" onClick={() => showPopconfirm(record.id)}>Issue an agreement</Button>
                        </Popconfirm>
                    </Space>
                );

            },
        }

    ];

    const fetchData = () => {
        setLoading(true);
        try {
            axios.get(`${server}/api/get/commodity`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    setData(response.data)
                    setLoading(false);
                    setTableParams({
                        ...tableParams,
                        pagination: {
                            ...tableParams.pagination,
                            total: 200,
                            // 200 is mock data, you should read it from server
                            // total: data.totalCount,
                        },
                    });
                } else {
                    message.error({ content: 'internal error' })
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
    useEffect(() => {
        fetchData();

    }, [JSON.stringify(tableParams)])

    return (
        <div className='content'>
            <HomeButton />
            <Table columns={columns} dataSource={data} />

        </div>
    )
}

export default ManageCommodity