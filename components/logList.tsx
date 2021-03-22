import { useState, useEffect } from 'react';
import getAPI from '../hooks/api';
import { Table, Space, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import { usePolling } from '../hooks/utils';

function useGetLogs(pollRate) {
    const [data, setData] = useState([]);
    usePolling(async () => {
        const logList = await getAPI().getLogs();
        setData(logList);
    }, pollRate, 'logs')
    return data;
}

export const LogList = ({ pollRate }) => {
    const size = "small"
    const data = useGetLogs(pollRate);
    const columns = [
        {
            title: 'Date/Time',
            dataIndex: 'formattedDate',
            key: 'formattedDate',
            width: '20%',
        },
        {
            title: 'Filename',
            dataIndex: 'fileName',
            key: 'fileName',
        },
        {
            title: 'Size',
            dataIndex: 'formattedSize',
            key: 'formattedSize',
            width: '12%',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            width: '20%',
            key: 'actions',
            render: (text, record) => <Space size={size}>
                <Button title="Copy File Path" type="primary" size={size} onClick={() => getAPI().copyLogPath(record)} icon={<CopyOutlined />}></Button>
            </Space>,
        },
    ];

    return <Table
        size="small"
        pagination={false}
        columns={columns}
        dataSource={data}
    />;
}
