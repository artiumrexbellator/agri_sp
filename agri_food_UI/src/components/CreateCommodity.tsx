import HomeButton from './HomeButton';
import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { QRCode } from 'antd';
import axios from 'axios';
import { server } from "../axios/axios"
const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

interface Commodity {
    id: string,
    origin: string,
    type: string,
}

/* eslint-disable no-template-curly-in-string */
const validateMessages = {
    required: '${label} is required!',
};
/* eslint-enable no-template-curly-in-string */


const CreateCommodity: React.FC = () => {
    const [commodity, setCommodity] = useState<Commodity>({ id: uuidv4(), origin: '', type: '' })
    const typeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const com: Commodity = { ...commodity, type: e.target.value }
        setCommodity(com)
    }
    const originHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const com: Commodity = { ...commodity, origin: e.target.value }
        setCommodity(com)
    }
    const submit = () => {
        try {
            axios.post(`${server}/api/createCommodity`, commodity, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    message.success({ content: 'commodity is added successfully' })
                } else {
                    message.error({ content: 'internal error' })
                }
            });
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className='content'>
            <HomeButton />

            <Form
                {...layout}
                name="nest-messages"
                validateMessages={validateMessages}
            >
                <Form.Item initialValue={commodity.id} name={['user', 'id']} label="id" >
                    <Input disabled />
                </Form.Item>
                <Form.Item name={['user', 'origin']} label="origin" rules={[{ required: true }]}>
                    <Input onChange={originHandler} />
                </Form.Item>
                <Form.Item name={['user', 'type']} label="type" rules={[{ required: true }]}>
                    <Input onChange={typeHandler} />
                </Form.Item>

                <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 12 }}>
                    <Button type="primary" htmlType="submit" onClick={submit}>
                        Submit
                    </Button>
                </Form.Item>
            </Form>
            <div style={{ padding: '10px' }}>
                <QRCode value={commodity.id} />
            </div>
        </div>
    );
}

export default CreateCommodity;
