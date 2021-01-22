import { useState, useEffect } from 'react';
import getAPI from '../hooks/api';
import { Table } from 'antd';

export const AppView = ({ uuid, pollForData }) => {
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

    const pollProcs = async () => {
        if (pollForData) {
            console.log('polling for app processes: ' + uuid)
            const procList = await getAPI().getAppProcesses(uuid);
            setData(procList);
        }
    }

    const startPolling = () => {
        timer = window.setInterval(() => pollProcs(), 1000);
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
