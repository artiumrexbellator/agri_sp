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

const Package: React.FC = () => {
    const [msp, setMsp] = useState<string | null>(null);
    const [scanned, setScanned] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [qr, setQr] = useState<string | null>(null);

    //search for the package after the code is scanned
    const searchPackage = () => {
        axios.get(`${server}/api/get/package`, { params: { id: qr }, withCredentials: true }).then(response => {
            if (response.status == 200) {
                message.success({ content: `package is retrieved successfully` })
                console.log(response.data)
                setScanned(true)

            } else {
                message.error({ content: 'internal error' })
            }
        });
    }
    //to get the msp org
    useEffect(() => {
        axios.get(`${server}/api/msp`, { withCredentials: true }).then(async (response) => {
            if (response.status == 200) {
                setMsp(response.data)
            }
        });
    }, [])
    // run the video stream

    useEffect(() => {

        const scanner = new QrScanner(videoRef.current!, (result: string) => {
            console.log(result)
            if (qr != result) {
                setQr(result);
            }


        });
        if (!scanned)
            scanner.start();
        else {

        }

        return () => {
            scanner.destroy();
            setQr(null);
        };
    }, [scanned]);

    //to change save the package on qr changed
    useEffect(() => {
        if (qr != null)
            searchPackage()
    }, [qr])


    return (
        <div className='content'>
            {!scanned && <video ref={videoRef} style={{ width: '30%', height: '30%' }} />}

            <HomeButton />
        </div>
    );
};

export default Package;
