import HomeButton from './HomeButton';
import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { QRCode } from 'antd';

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

const onFinish = (values: any) => {
    console.log(values);
};
const CreateCommodity: React.FC = () => {
    const uuid = uuidv4();
    const [commodity, setCommodity] = useState<Commodity>({ id: '0', origin: '', type: '' })
    const idHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const com: Commodity = { ...commodity, id: e.target.value }
        setCommodity(com)
    }
    const typeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const com: Commodity = { ...commodity, type: e.target.value }
        setCommodity(com)
    }
    const originHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const com: Commodity = { ...commodity, id: e.target.value }
        setCommodity(com)
    }
    const submit = () => {

    }
    return (
        <div className='content'>
            <HomeButton />

            <Form
                {...layout}
                name="nest-messages"
                onFinish={onFinish}
                validateMessages={validateMessages}
            >
                <Form.Item name={['user', 'id']} label="id" >
                    <Input disabled defaultValue={uuid} onChange={idHandler} />
                </Form.Item>
                <Form.Item name={['user', 'origin']} label="origin" rules={[{ required: true }]}>
                    <Input onChange={originHandler} />
                </Form.Item>
                <Form.Item name={['user', 'type']} label="type" rules={[{ required: true }]}>
                    <Input onChange={typeHandler} />
                </Form.Item>

                <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 12 }}>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
            <div style={{ padding: '10px' }}>
                <QRCode value={uuid} />
            </div>
        </div>
    );
}

export default CreateCommodity;
