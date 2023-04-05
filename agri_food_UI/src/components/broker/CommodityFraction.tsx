import HomeButton from '../HomeButton';
import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { server } from "../../axios/axios"
const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

interface CommodityFraction {
    id: string,
    quantity: number,
    commodity: string,
    agreement: string,
}

/* eslint-disable no-template-curly-in-string */
const validateMessages = {
    required: '${label} is required!',
};
/* eslint-enable no-template-curly-in-string */


const CommodityFraction: React.FC = () => {
    const [commodityFraction, setCommodityFraction] = useState<CommodityFraction>({ id: uuidv4(), quantity: 0, commodity: '', agreement: '', })
    const quantityHandler = (e: any) => {
        const cf: CommodityFraction = { ...commodityFraction, quantity: Number(e) }
        setCommodityFraction(cf)
    }
    const commodityHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: CommodityFraction = { ...commodityFraction, commodity: e.target.value }
        setCommodityFraction(cf)
    }
    const agreementHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: CommodityFraction = { ...commodityFraction, agreement: e.target.value }
        setCommodityFraction(cf)
    }
    const submit = () => {
        try {
            axios.post(`${server}/api/create/commodityFraction`, commodityFraction, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    message.success({ content: `commodity fraction is created successfully` })
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
                <Form.Item initialValue={commodityFraction.id} name={['user', 'id']} label="id" >
                    <Input disabled />
                </Form.Item>
                <Form.Item name={['user', 'commodity']} label="commodity" rules={[{ required: true }]}>
                    <Input onChange={commodityHandler} />
                </Form.Item>
                <Form.Item name={['user', 'agreement']} label="agreement" rules={[{ required: true }]}>
                    <Input onChange={agreementHandler} />
                </Form.Item>
                <Form.Item name={['user', 'quantity']} label="quantity" rules={[{ required: true }]}>
                    <InputNumber onChange={quantityHandler} />
                </Form.Item>
                <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 12 }}>
                    <Button type="primary" htmlType="submit" onClick={submit}>
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}

export default CommodityFraction;
