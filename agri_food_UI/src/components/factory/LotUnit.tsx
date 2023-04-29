import HomeButton from '../HomeButton';
import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { server } from "../../axios/axios"
import { stringify } from 'querystring';
const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

interface LotUnit {
    id: string,
    number: string,
    commodityFraction: string,
    agreement: string,
}

/* eslint-disable no-template-curly-in-string */
const validateMessages = {
    required: '${label} is required!',
};
/* eslint-enable no-template-curly-in-string */


const LotUnit: React.FC = () => {
    const [commodityFraction, setCommodityFraction] = useState<LotUnit>({ id: uuidv4(), number: '0', commodityFraction: '', agreement: '', })
    const numberHandler = (e: any) => {
        const cf: LotUnit = { ...commodityFraction, number: String(e) }
        setCommodityFraction(cf)
    }
    const commodityFractionHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: LotUnit = { ...commodityFraction, commodityFraction: e.target.value }
        setCommodityFraction(cf)
    }
    const agreementHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cf: LotUnit = { ...commodityFraction, agreement: e.target.value }
        setCommodityFraction(cf)
    }
    const submit = () => {
        try {
            axios.post(`${server}/api/create/lotUnit`, commodityFraction, { withCredentials: true }).then(response => {
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
                <Form.Item name={['user', 'commodityFraction']} label="commodity fraction" rules={[{ required: true }]}>
                    <Input onChange={commodityFractionHandler} />
                </Form.Item>
                <Form.Item name={['user', 'agreement']} label="agreement" rules={[{ required: true }]}>
                    <Input onChange={agreementHandler} />
                </Form.Item>
                <Form.Item name={['user', 'number']} label="lot number" rules={[{ required: true }]}>
                    <InputNumber onChange={numberHandler} />
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
