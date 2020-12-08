import { useState, useEffect } from 'react';
import { getPIDEntities } from '../hooks/api';
import { Table } from 'antd';

export const PIDView = ({ pid, pollForData }) => {
    let timer = 0;
    const [data, setData] = useState([]);
    const columns = [
        {
            title: 'UUID',
            dataIndex: 'uuid',
            key: 'uuid',
            width: '12%',
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
        },
        {
            title: 'CPU',
            dataIndex: 'cpu',
            key: 'cpu',
            width: '12%',
        },
        {
            title: 'Mem',
            dataIndex: 'mem',
            key: 'mem',
            width: '12%',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: '20%',
            key: 'actions',
        },
    ];

    const pollPID = async () => {
        if (pollForData) {
            console.log('polling for PID: ' + pid)
            const procList = await getPIDEntities(pid);
            setData(procList);
        }
    }

    const startPolling = () => {
        timer = window.setInterval(() => pollPID(), 1000);
    }

    const stopPolling = () => {
        window.clearInterval(timer);
    }

    useEffect(() => {
        startPolling()
        return () => stopPolling()
    })

    return <Table
        pagination={false}
        columns={columns}
        dataSource={data}
    />;
}
