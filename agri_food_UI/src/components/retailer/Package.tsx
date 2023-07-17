import React, { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import HomeButton from "../HomeButton";
import axios from "axios";
import { server } from "../../axios/axios";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
interface Commodity {
    origin: string;
    type: string;
    created_date: string;
}

interface Fraction {
    quantity: string;
    created_date: string;
}

interface Lot {
    created_date: string;
    lot_number: string;
    quantity: number;
}

export interface Pack {
    commodity: Commodity;
    fraction: Fraction;
    lot: Lot;
    qr: string;
    holders: [[string, string]];
    created_date: string;


}
const Package: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [qr, setQr] = useState<string | null>(null);
    const navigate = useNavigate();
    //to get the package
    useEffect(() => {
        if (qr !== null) {
            axios
                .get(`${server}/api/get/package`, {
                    params: { id: qr },
                    withCredentials: true
                })
                .then(response => {
                    if (response.status === 200) {
                        message.success({ content: `package is retrieved successfully` });
                        const data = response.data
                        const pkg: Pack = {
                            commodity: {
                                created_date: data.CF.Commodity.created_date,
                                origin: data.CF.Commodity.origin,
                                type: data.CF.Commodity.type
                            },
                            fraction: {
                                quantity: data.CF.Fraction.quantity,
                                created_date: data.CF.Fraction.created_date
                            },
                            lot: {
                                quantity: data.Lot.quantity,
                                created_date: data.Lot.created_date,
                                lot_number: data.Lot.lot_number
                            },
                            qr: data.Pkg.id,
                            created_date: data.Pkg.created_date,
                            holders: data.Pkg.holders.map((holder: any) => {
                                return [holder.organization, holder.holdDate]
                            })
                        }
                        navigate('/timeLine', { state: { pkg: pkg } })

                    } else {
                        message.error({ content: 'internal error' });
                    }
                })
        }
    }, [qr]);

    useEffect(() => {
        const scanner = new QrScanner(videoRef.current!, async result => {
            if (qr !== result && result !== null) {
                setQr(result);
            }
        });

        scanner.start();
        return () => {
            scanner.destroy();
            setQr(null);
        };
    }, []);


    return (
        <div className='content'>
            <video ref={videoRef} style={{ width: '30%', height: '30%' }} />

            <HomeButton />
        </div>
    );
};

export default Package;
