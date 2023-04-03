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
    const columns: ColumnsType<DataType> = [
        {
            title: 'agreement',
            dataIndex: 'id',
        },
        {
            title: 'asset',
            dataIndex: 'asset_id',
            sorter: true,
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

export default ManageAgreements