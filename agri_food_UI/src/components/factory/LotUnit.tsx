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

interface LotUnit {
    id: string,
    commodityFRC: string,
    agreement: string,
    lotNumber: string,
    quantity: number
}

/* eslint-disable no-template-curly-in-string */
const validateMessages = {
    required: '${label} is required!',
};
/* eslint-enable no-template-curly-in-string */


const LotUnit: React.FC = () => {
    const [lotUnit, setCommodityFraction] = useState<LotUnit>({ id: uuidv4(), commodityFRC: '', lotNumber: '', agreement: '', quantity: 0 })
    const quantityHandler = (e: any) => {
        const cf: LotUnit = { ...lotUnit, quantity: Number(e) }
        setCommodityFraction(cf)
    }
    const numberHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: LotUnit = { ...lotUnit, lotNumber: e.target.value }
        setCommodityFraction(cf)
    }
    const commodityFractionHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: LotUnit = { ...lotUnit, commodityFRC: e.target.value }
        setCommodityFraction(cf)
    }

    const agreementHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: LotUnit = { ...lotUnit, agreement: e.target.value }
        setCommodityFraction(cf)
    }
    const submit = () => {
        try {
            axios.post(`${server}/api/create/lotUnit`, lotUnit, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    message.success({ content: `the lot unit is created successfully` })
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
                <Form.Item initialValue={lotUnit.id} name={['user', 'id']} label="id" >
                    <Input disabled />
                </Form.Item>
                <Form.Item name={['user', 'lotUnit']} label="comm fraction" rules={[{ required: true }]}>
                    <Input onChange={commodityFractionHandler} />
                </Form.Item>
                <Form.Item name={['user', 'agreement']} label="agreement" rules={[{ required: true }]}>
                    <Input onChange={agreementHandler} />
                </Form.Item>
                <Form.Item name={['user', 'quantity']} label="quantity" rules={[{ required: true }]}>
                    <InputNumber onChange={quantityHandler} />
                </Form.Item>
                <Form.Item name={['user', 'number']} label="lot serial" rules={[{ required: true }]}>
                    <Input onChange={numberHandler} />
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

export default LotUnit;
