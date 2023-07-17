import React, { useState } from "react";
import { Result, Button, Modal, Upload, UploadProps, Input, Select, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useReducer } from 'react';
import { server } from '../axios/axios'
import axios from 'axios';
import { useNavigate, Navigate } from "react-router-dom";
interface Login {
    mspId: string,
    identity: string,
    cert: string,
    key: string
}


//action types
const AUTH_MSPID = 'AUTH_MSPID';
const AUTH_IDENTITY = 'AUTH_IDENTITY';
const AUTH_KEY = 'AUTH_KEY';
const AUTH_CERT = 'AUTH_CERT';

//reducer 
const reducer = (state: Login, action: any) => {
    switch (action.type) {
        case AUTH_MSPID:
            return {
                ...state,
                mspId: action.payload.mspId
            };
        case AUTH_KEY:
            return {
                ...state,
                key: action.payload.key
            };
        case AUTH_CERT:
            return {
                ...state,
                cert: action.payload.cert
            };
        case AUTH_IDENTITY:
            return {
                ...state,
                identity: action.payload.identity
            };

        default:
            return state;
    }
};

//select options
const { Option } = Select;


const Connect: React.FC = () => {
    // Define the initial state for authentication
    const initialState: Login = {
        mspId: 'FarmerMSP',
        identity: '',
        cert: '',
        key: '',
    };
    const selectAfter = (
        <Select defaultValue={initialState.mspId} onChange={(e: string) => {
            dispatch({ type: AUTH_MSPID, payload: { mspId: e } })
        }}>
            <Option value="SupplierMSP">@supplier.com</Option>
            <Option value="FarmerMSP">@farmer.com</Option>
            <Option value="BrokerMSP">@broker.com</Option>
            <Option value="FactoryMSP">@factory.com</Option>
            <Option value="DistributorMSP">@distributor.com</Option>
            <Option value="WholesalerMSP">@wholesaler.com</Option>
            <Option value="RetailerMSP">@retailer.com</Option>
        </Select>
    );
    const [state, dispatch] = useReducer(reducer, initialState);
    const [authModal, setAuthModal] = useState(false)
    const navigate = useNavigate();
    const handleUploadCert: UploadProps = {
        name: 'cert',
        action: `${server}/upload/cert`,

        headers: {
            authorization: 'authorization-text',
        },
        onChange(info) {
            if (info.file.status !== 'uploading') {
            }
            if (info.file.status === 'done') {
                dispatch({ type: AUTH_CERT, payload: { cert: info.file.response.filename } })
                message.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
    };
    const handleUploadKey: UploadProps = {
        name: 'key',
        action: `${server}/upload/key`,

        headers: {
            authorization: 'authorization-text',
        },
        onChange(info) {
            if (info.file.status !== 'uploading') {
            }
            if (info.file.status === 'done') {
                dispatch({ type: AUTH_KEY, payload: { key: info.file.response.filename } })
                message.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        },

    };

    //handle modal ok
    const modalOk = async () => {
        if (state.identity == '') {
            message.error({ content: 'please provide the identity' })
            return
        }
        else if (state.cert == '') {
            message.error({ content: 'please provide the cert' })
            return
        } else if (state.key == '') {
            message.error({ content: 'please provide the key' })
            return
        }
        try {
            await axios.post(`${server}/api/auth`, state, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    setAuthModal(false)
                    message.success({ content: 'the identity is signed successfully' }).then(() => {
                        window.location.reload()
                    })
                } else if (response.status == 400) {
                    message.error({ content: 'error signing certificat and key' })
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
    return (
        <div className="content">
            <Result
                status="info"
                title="Connect"
                subTitle="Please click the button below to connect"
                extra={<div style={{
                    display: 'flex',
                    justifyContent: 'space-around'
                }}><Button type="primary" onClick={() => { setAuthModal(true) }}>Auth</Button></div>}
            />
            <Modal
                title="Authentification"
                centered
                open={authModal}
                onOk={modalOk}
                onCancel={() => setAuthModal(false)}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: '200px',
                    flexDirection: 'column',

                }}>
                    <Upload {...handleUploadCert} maxCount={1}>
                        <Button icon={<UploadOutlined />}>Upload cert</Button>
                    </Upload>
                    <Upload {...handleUploadKey} maxCount={1}>
                        <Button icon={<UploadOutlined />}>Upload key</Button>
                    </Upload>
                    <Input addonAfter={selectAfter} placeholder="please choose your identity's username" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        dispatch({ type: AUTH_IDENTITY, payload: { identity: e.target.value } })
                    }} value={state.identity} required />
                </div>

            </Modal>
        </div>
    );
}

export default Connect