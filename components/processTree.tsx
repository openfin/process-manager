import * as React from 'react';
import { Modal, Table, Button } from 'antd';
import { getProcessTree, getItemInfo } from '../hooks/utils';
import { TableHeader } from './tableHeader';
import { ProcessActions } from './processActions';
import { PidLink } from './pidLink';

interface ProcessTreeProps {
    pollForData: boolean;
}

interface ProcessTreeState {
    data: Object[];
    columns: any[];
    modalVisible: boolean;
    modalTitle: string;
    modalContents: string;
    scrollX: number;
    scrollY: number;
}

export class ProcessTree extends React.Component<ProcessTreeProps, ProcessTreeState> {
    timer = 0;
    components = {
        header: {
            cell: TableHeader
        }
    }

    constructor(props: ProcessTreeProps) {
        super(props);
        this.state = {
            columns: [
                {
                    title: 'PID',
                    dataIndex: 'pid',
                    key: 'pid',
                    width: 150,
                    render: (text, record) => <PidLink pid={record.pid} />,
                    fixed: 'left',
                    resizable: false,
                },
                {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                    width: 350,
                },
                {
                    title: 'URL',
                    dataIndex: 'url',
                    key: 'url',
                    width: 450,
                },
                {
                    title: 'Actions',
                    width: 200,
                    key: 'actions',
                    render: (text, record) => <ProcessActions item={record} infoHandler={this.showInfo.bind(this)}/>,
                    fixed: 'right',
                    resizable: false,
                },
            ],
            data: [],
            modalTitle: '',
            modalVisible: false,
            modalContents: '',
            scrollX: 800,
            scrollY: 500,
        };
    }

    componentDidMount() {
        this.startPolling();
    }

    componentWillUnmount() {
        this.stopPolling();
    }

    render() {
        const columns = this.state.columns.map((col, index) => ({
            ...col,
            onHeaderCell: (column) => ({
                width: column.width,
                onResize: this.handleColumnResize(index),
                resizable: column.resizable,
            })
        }));
        return <div>
            <Table
                bordered
                pagination={false}
                columns={columns}
                components={this.components}
                dataSource={(this.state as ProcessTreeState).data}
                scroll={{ x: (this.state as ProcessTreeState).scrollX, y: (this.state as ProcessTreeState).scrollY }}
                size="small"
            />
            <Modal title={(this.state as ProcessTreeState).modalTitle} visible={(this.state as ProcessTreeState).modalVisible} onCancel={this.hideModal.bind(this)} footer={[
                <Button key="1" onClick={this.hideModal.bind(this)}>Close</Button>
                ]}>
                <pre>{(this.state as ProcessTreeState).modalContents}</pre>
            </Modal>
        </div>;
    }

    startPolling() {
        this.pollForApps();
        this.timer = window.setInterval(() => this.pollForApps(), 1000);
    }

    stopPolling() {
        window.clearInterval(this.timer);
    }

    private async pollForApps() {
        if (this.props.pollForData) {
            console.log('polling for apps')
            const procList = await getProcessTree();
            this.setState({ data: procList });
        }
    }

    async showInfo(item: any) {
        console.log('asdf', item)
        const info = await getItemInfo(item);
        this.showModal(item.type, JSON.stringify(info, null, 4));
    }

    showModal(title: string, contents: string) {
        this.setState({ modalVisible: true, modalTitle: title, modalContents: contents });
    }

    hideModal() {
        this.setState({ modalVisible: false });
    }

    handleColumnResize = (index) => (e, { size }) => {
        this.setState(({ columns }) => {
            const nextColumns = [...columns];
            nextColumns[index] = {
                ...nextColumns[index],
                width: size.width
            };
            return { columns: nextColumns };
        });
    };
}