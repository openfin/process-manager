import { useState, useEffect } from 'react';
import getAPI from '../hooks/api';
import { usePolling, formatBytes } from '../hooks/utils';
import { Table } from 'antd';

function useAppProcesses(pollRate, uuid) {
    const [list, setList] = useState([]);
    usePolling(async () => {
        const procList = await getAPI().getAppProcesses(uuid);
        setList(procList)
    }, pollRate, 'app-processes')
    return list;
}

export const AppView = ({ uuid, pollRate }) => {
    const data = useAppProcesses(pollRate, uuid);

    const columns = [
        {
            title: 'PID',
            dataIndex: 'pid',
            key: 'pid',
            width: '10%',
        },
        {
            title: 'Entity',
            dataIndex: 'entityType',
            key: 'entityType',
            width: '10%',
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
        },
        {
            title: 'CPU',
            dataIndex: 'cpuUsage',
            key: 'cpuUsage',
            width: '12%',
        },
        {
            title: 'Mem',
            dataIndex: 'privateSetSize',
            key: 'privateSetSize',
            width: '12%',
            render: (text, record) => {
                return formatBytes(record.privateSetSize, 1)
            },
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: '20%',
            key: 'actions',
        },
    ];

    return <Table
        pagination={false}
        columns={columns}
        dataSource={data}
    />;
}
