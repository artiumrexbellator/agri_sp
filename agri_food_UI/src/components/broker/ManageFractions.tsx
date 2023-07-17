import HomeButton from "../HomeButton";
import React, { useState, useEffect } from 'react';
import { Button, Space, Table, message, Modal, Popconfirm } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

import { server } from "../../axios/axios";

interface Commodity {
    id: string;
    origin: string;
    type: string;
    created_date: string;
}

interface Fraction {
    id: string,
    quantity: string;
    created_date: string;
    agreement_id: string;
    commodity: Commodity;

}

interface TableParams {
    pagination?: TablePaginationConfig;
    sortField?: string;
    sortOrder?: string;
    filters?: Record<string, FilterValue>;
}

const ManageFractions: React.FC = () => {

    const [confirmStates, setConfirmStates] = useState<{ [key: string]: boolean }>({});
    const [confirmLoading, setConfirmLoading] = useState({});
    const [data, setData] = useState<Fraction[]>();
    const [loading, setLoading] = useState(false);
    const [tableParams, setTableParams] = useState<TableParams>({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });

    const columns: ColumnsType<Fraction> = [
        {
            title: 'Fraction N',
            dataIndex: 'id',
            sorter: true,
        }, Table.EXPAND_COLUMN,
        {
            title: 'quantity',
            dataIndex: 'quantity',
            sorter: true,
        }, {
            title: 'Created at',
            dataIndex: 'created_date',
        }
        , {
            title: 'Commodity',
            render: (text, record) => {

                const commodityColumns: ColumnsType<Commodity> = [
                    {
                        title: 'origin',
                        dataIndex: 'origin',
                        sorter: true,
                    }, Table.EXPAND_COLUMN
                    , {
                        title: 'type',
                        dataIndex: 'type',
                        sorter: true,
                    }, {
                        title: 'created at',
                        dataIndex: 'created_date',
                        sorter: true,
                        width: '10%'
                    },
                ]
                const config = {
                    title: 'Commodity',
                    width: '100%',
                    zIndex: 100000,
                    content: (
                        <Table columns={commodityColumns} expandable={{
                            expandedRowRender: (_) => <p style={{ margin: 0 }}>commodity N <h4>{record.commodity.id}</h4></p>,
                        }} dataSource={[record.commodity]} scroll={{
                            x: 'max-content'
                        }} />
                    ),

                };
                return (
                    <Space size="middle">
                        <Space>
                            <Button type="dashed" onClick={() => {
                                Modal.info(config);
                            }}>commodity</Button>
                        </Space>
                    </Space>
                );

            },
        }, {
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
                return (
                    <Space size="middle">
                        <Popconfirm
                            title="Title"
                            description={`Do you want to create an agreement for the fraction ${record.id}?`}
                            open={confirmStates[record.id] || false}
                            onConfirm={() => handleOk(record.id)}
                            okButtonProps={{ loading: confirmLoading }}
                            onCancel={() => handleCancel(record.id)}
                        >
                            <Space>
                                <Button type="primary" onClick={() => showPopconfirm(record.id)}>Issue an agreement</Button>
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
            axios.get(`${server}/api/get/commodityFraction`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    const data: Fraction[] = response.data.map((record: any) => ({
                        ...record.Fraction,
                        commodity: record.Commodity
                    }));
                    setData(data)
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
            <Table columns={columns} expandable={{
                expandedRowRender: (record) => <span style={{ margin: 0 }}>Agreement N <h4>{record.agreement_id}</h4></span>,
            }} dataSource={data} />

        </div>
    )
}

export default ManageFractions