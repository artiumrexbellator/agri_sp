import React, { useEffect, useState } from "react";
import HomeButton from "../HomeButton";
import { Pack } from "./Package";
import { useLocation } from "react-router-dom";
import { Timeline, QRCode, Space } from 'antd';



const colors = ['yellow', 'white', 'black']
const TimeLine: React.FC = () => {
    const location = useLocation();
    const [pkg, setPkg] = useState<Pack | null>(null)
    const [text, setText] = React.useState('');
    const [items, setItems] = useState<Array<{ children: string, color?: string, dot?: JSX.Element }>>([])

    useEffect(() => {
        setPkg(location.state.pkg);
        setText(location.state.pkg.qr);
        console.log(location.state.pkg)
    }, [])

    useEffect(() => {
        const newItems = [
            {
                children: `From the commodity of ${pkg?.commodity.type} originated in ${pkg?.commodity.origin} and initiated at ${pkg?.commodity.created_date}`,
                label: "The Farmer"
            },
            {
                children: `received in a fraction by a broker at ${pkg?.fraction.created_date}`,
                color: 'green',
            },
            {
                color: 'magenta',
                children: `package belongs to the containing lot with the number ${pkg?.lot.lot_number} which was created at ${pkg?.lot.created_date}`,
            },
        ];

        if (pkg?.holders) {
            pkg.holders.forEach((holder: any, index: number) => {
                newItems.push({
                    children: `received by the ${holder[0].split('MSP')[0]} at ${holder[1]}`,
                    color: colors[index % colors.length],
                });
            });
        }

        setItems(newItems);
    }, [pkg]);

    return (
        <div className='content'>
            <HomeButton />
            {
                pkg &&
                <Space direction="vertical" align="center">

                    <Timeline
                        mode="alternate"
                        items={items}
                    />
                    <QRCode value={text || '-'} />
                </Space>

            }
        </div>
    );
};

export default TimeLine;
