import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
import { Modal, Table, Button } from 'antd';
import getAPI, { EntityType } from '../hooks/api';
import { TableHeader } from './tableHeader';
import { ProcessActions } from './processActions';
import { AppLink } from './appLink';

declare type FixedType = 'left' | 'center' | 'right';
const left:FixedType = 'left';
const right:FixedType = 'right';

export const ProcessTree = ({ pollForData, headerHeight, initialWidth, initialHeight }) => {
    const components = {
        header: {
            cell: TableHeader
        }
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'title',
            key: 'name',
            render: (text, record) => {
                if (record.entityType === EntityType.Application) {
                    return <AppLink uuid={record.identity.uuid} text={record.identity.uuid} />
                }
                return record.identity.name || record.identity.uuid
            },
            width: '40%',
            ellipsis: true,
            fixed: left,
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            width: '40%',
            ellipsis: true,
        },
        {
            title: 'Actions',
            width: 200,
            key: 'actions',
            render: (text, record) => <ProcessActions item={record} infoHandler={showInfo}/>,
            fixed: right,
        },
    ];

    const [resizing, setResizing] = useState(false);
    const [scrollX, setScrollX] = useState(initialWidth);
    const [scrollY, setScrollY] = useState(initialHeight);
    const [expandedRows, setExpandedRows] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContents, setModalContents] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [tree, setTree] = useState({applications: []});

    let pollingTimer = 0;

    const pollForApps = async () => {
        if (pollForData && !resizing) {
            const procModel = await getAPI().getProcessTree();
            setTree(procModel)
        }
    }

    const startPolling = () => {
        pollForApps()
        pollingTimer = window.setInterval(() => pollForApps(), 1000);
    }

    const stopPolling = () => {
        window.clearInterval(pollingTimer);
    }

    const calcSize = () => {
        let h = document.body.clientHeight - headerHeight;
        setScrollY(h);
    }

    const showInfo = async (item: any) => {
        const info = await getAPI().getItemInfo(item.identity, item.entityType);
        showModal(`${item.entityType} Info`, JSON.stringify(info, null, 4));
    }

    const showModal = (title: string, contents: string) => {
        setModalVisible(true);
        setModalTitle(title);
        setModalContents(contents);
    }

    const hideModal = () => {
        setModalVisible(false);
    }

    useEffect(() => {
        let resizeTimeout = 0;
        const resizer = () => {
            setResizing(true);
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(()=> {
                calcSize();
                setResizing(false);
            }, 100);
        };
        window.addEventListener('resize', resizer);
        startPolling();
        return () => {
            window.removeEventListener('resize', resizer)
            stopPolling();
        }
    }, [pollForData])

    return <div>
        <Table
            bordered
            sticky
            pagination={false}
            columns={columns}
            components={components}
            dataSource={tree.applications}
            scroll={{ x: scrollX, y: scrollY }}
            size="small"
            expandable={{onExpandedRowsChange: (expRows:string[]) => {
                setExpandedRows(expRows)
            }}}
        />
        <Modal className="firstcap" bodyStyle={{textTransform: 'none'}} title={modalTitle} visible={modalVisible} onCancel={hideModal} footer={[
            <Button key="1" onClick={hideModal}>Close</Button>
            ]}>
            <pre>{modalContents}</pre>
        </Modal>
    </div>;
}