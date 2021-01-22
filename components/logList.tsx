import { useState, useEffect } from 'react';
import getAPI from '../hooks/api';
import { Table, Space, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
export const LogList = ({ pollForData }) => {
    const size = "small"
    let timer = 0;
    const [data, setData] = useState([]);
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

    const pollLogs = async () => {
        if (pollForData) {
            const logList = await getAPI().getLogs();
            setData(logList);
        }
    }

    const startPolling = () => {
        pollLogs()
        timer = window.setInterval(() => pollLogs(), 1000);
    }

    const stopPolling = () => {
        window.clearInterval(timer);
    }

    useEffect(() => {
        startPolling()
        return () => stopPolling()
    })

    return <Table
        size="small"
        pagination={false}
        columns={columns}
        dataSource={data}
    />;
}
