import React, { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import HomeButton from "../HomeButton";
import axios from "axios";
import { server } from "../../axios/axios";
import { message, Select } from "antd";

interface LotUnit {
    id: string,
    qte: string,
    lotNumber: string,
    createdAt: string,
}

const QrCodeScanner: React.FC = () => {
    const handleChange = (value: string) => {
        setActiveLot(value)
    };
    const savePackage = () => {
        console.log('here ' + activeLot)
        if (activeLot == null || qr == null)
            return
        axios.post(`${server}/api/create/package`, { id: qr, lot: activeLot }, { withCredentials: true }).then(response => {
            if (response.status == 200) {
                message.success({ content: `package is added successfully` })

            } else {
                message.error({ content: 'internal error' })
            }
        });
    }
    const videoRef = useRef<HTMLVideoElement>(null);
    const [qr, setQr] = useState<string | null>(null);
    const [data, setData] = useState<LotUnit[] | null>(null);
    const [activeLot, setActiveLot] = useState<string | null>(null)
    const fetchData = async () => {
        try {
            await axios.get(`${server}/api/get/lotUnits`, { withCredentials: true }).then(response => {
                if (response.status == 200) {
                    const result: LotUnit[] = response.data.map((record: any) => ({
                        id: record.id,
                        qte: record.quantity,
                        lotNumber: record.lot_number,
                        createdAt: record.created_date
                    }));
                    setData(result)
                } else {
                    message.error({ content: 'internal error' })
                }
            });
        } catch (err) {
            message.error({ content: "internal error" })
        }
    }
    useEffect(() => {
        fetchData()
        const scanner = new QrScanner(videoRef.current!, (result: string) => {
            console.log(result)
            if (qr != result) {
                setQr(result);
            }


        });
        scanner.start();

        return () => {
            scanner.destroy();
            setQr(null);
        };
    }, []);
    useEffect(() => {
        savePackage()
    }, [qr])
    return (
        <div className='content'>
            <Select
                showSearch
                style={{ width: 200 }}
                placeholder="Search the lot unit"
                options={data?.map((val) => ({ value: val.id, label: val.id }))}
                onChange={handleChange}
            >
            </Select>
            <video ref={videoRef} style={{ width: '30%', height: '30%' }} />
            <HomeButton />
        </div>
    );
};

export default QrCodeScanner;
