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

interface Supply {
    id: string,
    quantity: number,
    type: string,
    commodity: string,
    agreement: string,
}

/* eslint-disable no-template-curly-in-string */
const validateMessages = {
    required: '${label} is required!',
};
/* eslint-enable no-template-curly-in-string */


const PushSupplies: React.FC = () => {
    const [supply, setSupply] = useState<Supply>({ id: uuidv4(), quantity: 0, type: '', commodity: '', agreement: '', })
    const typeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sup: Supply = { ...supply, type: e.target.value }
        setSupply(sup)
    }
    const quantityHandler = (e: any) => {
        const sup: Supply = { ...supply, quantity: Number(e) }
        setSupply(sup)
    }
    const commodityHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sup: Supply = { ...supply, commodity: e.target.value }
        setSupply(sup)
    }
    const agreementHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sup: Supply = { ...supply, agreement: e.target.value }
        setSupply(sup)
    }
    const submit = () => {

        axios.post(`${server}/api/create/supply`, supply, { withCredentials: true }).then(response => {
            if (response.status == 200) {
                message.success({ content: `supply is added successfully to the commodity ${supply.commodity}` })
            } else {
                message.error({ content: 'internal error' })
            }
        }).catch((err) => {
            message.error({ content: 'internal error verify identifiers' })
        });

    };

    return (
        <div className='content'>
            <HomeButton />

            <Form
                {...layout}
                name="nest-messages"
                validateMessages={validateMessages}
            >
                <Form.Item initialValue={supply.id} name={['user', 'id']} label="id" >
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
                <Form.Item name={['user', 'type']} label="type" rules={[{ required: true }]}>
                    <Input onChange={typeHandler} />
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

export default PushSupplies;
