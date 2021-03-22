import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
import { Modal, Table, Button } from 'antd';
import getAPI, { EntityType } from '../hooks/api';
import { usePolling } from '../hooks/utils';
import { TableHeader } from './tableHeader';
import { ProcessActions } from './processActions';
import { AppLink } from './appLink';

declare type FixedType = 'left' | 'center' | 'right';
const left:FixedType = 'left';
const right:FixedType = 'right';

function useProcessTree(pollRate) {
    const [tree, setTree] = useState({applications:[]});
    usePolling(async () => {
        const t = await getAPI().getProcessTree()
        setTree(t)
    }, pollRate, 'tree')
    return tree;
}

export const ProcessTree = ({ pollRate }) => {
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
            width: '30%',
            ellipsis: true,
            fixed: left,
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            width: '90%',
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

    const tree = useProcessTree(pollRate)
    const [expandedRows, setExpandedRows] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContents, setModalContents] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

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

    return <div>
        <Table
            bordered
            sticky
            pagination={false}
            columns={columns}
            components={components}
            dataSource={tree.applications}
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