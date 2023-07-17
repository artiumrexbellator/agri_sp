import HomeButton from "../HomeButton";
import React, { useState, useEffect } from 'react';
import { Button, Space, Table, Popconfirm, message, Modal } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { server } from "../../axios/axios";

interface Supply {
    id: string,
    owner: string,
    quantity: number,
    type: string,
}
interface DataType {
    id: string,
    origin: string;
    type: string;
    created_date: string;
    supplies?: Supply[]
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
            title: 'Identifier',
            dataIndex: 'id',
            sorter: true,
        },
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
            dataIndex: 'created_date',
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
                    try {
                        axios.post(`${server}/api/create/agreement`, { assetId: id, agreementId: uuidv4() }, { withCredentials: true }).then(response => {
                            if (response.status == 200) {
                                message.success({ content: 'agreement is added successfully' })
                            } else {
                                message.error({ content: 'internal error' })
                            }
                        });
                    } catch (err) {
                        message.error({ content: 'internal error' })
                    }
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
                const supplyColumns: ColumnsType<Supply> = [
                    {
                        title: 'Identifier',
                        dataIndex: 'id',
                        sorter: true,
                    }, Table.EXPAND_COLUMN
                    , {
                        title: 'type',
                        dataIndex: 'type',
                        sorter: true,
                    }, {
                        title: 'quantity',
                        dataIndex: 'quantity',
                        sorter: true,
                        width: '10%'
                    },
                ]
                const config = {
                    title: 'Supplies',
                    width: '100%',
                    zIndex: 100000,
                    content: (
                        <Table columns={supplyColumns} expandable={{
                            expandedRowRender: (record) => <p style={{ margin: 0 }}>{record.owner}</p>,
                        }} dataSource={record.supplies} scroll={{
                            x: 'max-content'
                        }} />
                    ),

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
                            <Space>
                                <Button type="primary" onClick={() => showPopconfirm(record.id)}>Issue an agreement</Button>
                                <Button type="dashed" onClick={() => {
                                    Modal.info(config);
                                }}>supplies</Button>
                            </Space>
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
                    console.log(response.data)
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
            message.error({ content: "internal error" })
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