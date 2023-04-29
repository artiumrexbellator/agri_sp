import React, { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";

const QrCodeScanner: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        const scanner = new QrScanner(videoRef.current!, (result: string) => {
            console.log(result)
            setResult(result);
        });

        scanner.start();

        return () => {
            scanner.destroy();
        };
    }, []);
    return (
        <div className='content'>
            <video ref={videoRef} style={{ width: '50%' }} />
            {result && <p>{result}</p>}
        </div>
    );
};

export default QrCodeScanner;
