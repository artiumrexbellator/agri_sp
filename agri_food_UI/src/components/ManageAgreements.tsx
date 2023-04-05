import HomeButton from "./HomeButton";
import React, { useState, useEffect } from 'react';
import { Table, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import axios from "axios";
import { server } from "../axios/axios";

interface DataType {
    id: string,
    owner: string;
    asset_id: string;
    created_date?: string;
    used_by?: string;
    organization?: string;
    consumed: boolean;
}

interface TableParams {
    pagination?: TablePaginationConfig;
    sortField?: string;
    sortOrder?: string;
    filters?: Record<string, FilterValue>;
}


const ManageAgreements: React.FC = () => {
    const [data, setData] = useState<DataType[]>();
    const [loading, setLoading] = useState(false);
    const [tableParams, setTableParams] = useState<TableParams>({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });
    const textCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        console.log(text)
        message.success("text copied to clipboard")
    }
    const columns: ColumnsType<DataType> = [
        {
            title: 'agreement',
            dataIndex: 'id',
            render: (text) => (<span onClick={() => { textCopy(String(text)) }}>{text}</span>)
        },
        {
            title: 'asset',
            dataIndex: 'asset_id',
            sorter: true,
            render: (text) => (<span onClick={() => { textCopy(String(text)) }}>{text}</span>)
        },
        {
            title: 'Consumed',
            dataIndex: 'consumed',
            sorter: true,
            render: (text) => String(text)

        }, {
            title: 'Created at',
            dataIndex: 'created_date',
            sorter: true,

        }, {
            title: 'Used by',
            dataIndex: 'used_by',
            sorter: true,

        }, {
            title: 'Belongs to',
            dataIndex: 'organization',
            sorter: true,

        }


    ];

    const fetchData = () => {
        setLoading(true);
        try {
            axios.get(`${server}/api/get/agreements`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    setData(response.data)
                    setLoading(false);
                    setTableParams({
                        ...tableParams,
                        pagination: {
                            ...tableParams.pagination,
                            total: 200,
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
            <Table columns={columns} dataSource={data} style={{ width: '80%' }} scroll={{
                x: 'max-content'
            }} />

        </div>
    )
}

export default ManageAgreements