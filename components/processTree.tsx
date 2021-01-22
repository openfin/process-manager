import * as React from 'react';
import { Modal, Table, Button } from 'antd';
import getAPI, { EntityType, ProcessModel } from '../hooks/api';
import { TableHeader } from './tableHeader';
import { ProcessActions } from './processActions';
import { AppLink } from './appLink';

interface ProcessTreeProps {
    pollForData: boolean;
    headerHeight: number;
    scrollX: number;
    scrollY: number;
}

interface ProcessTreeState {
    tree: ProcessModel;
    columns: any[];
    modalVisible: boolean;
    modalTitle: string;
    modalContents: string;
    scrollX: number;
    scrollY: number;
    expandedRows: string[];
}

export class ProcessTree extends React.Component<ProcessTreeProps, ProcessTreeState> {
    timer = 0;
    resizing = false;
    components = {
        header: {
            cell: TableHeader
        }
    }
    expandable = {
        onExpandedRowsChange: (expRows:string[]) => {
            console.log('expanding', expRows);
            this.setState({ expandedRows: expRows});
        },
    }

    constructor(props: ProcessTreeProps) {
        super(props);
        this.state = {
            columns: [
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
                    width: 250,
                    ellipsis: true,
                    fixed: 'left',
                },
                {
                    title: 'URL',
                    dataIndex: 'url',
                    key: 'url',
                    width: 450,
                    ellipsis: true,
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
            tree: { applications: [] },
            modalTitle: '',
            modalVisible: false,
            modalContents: '',
            scrollX: props.scrollX,
            scrollY: props.scrollY,
            expandedRows: [],
        };
    }

    componentDidMount() {
        this.startPolling();
        this.setSize();
        let resizeTimeout = 0;
        window.addEventListener('resize', () => {
            this.resizing = true;
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(()=> {
                this.setSize();
                this.resizing = false;
            }, 100);
        });
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
                sticky
                pagination={false}
                columns={columns}
                components={this.components}
                dataSource={(this.state as ProcessTreeState).tree.applications}
                scroll={{ x: (this.state as ProcessTreeState).scrollX, y: (this.state as ProcessTreeState).scrollY }}
                size="small"
                expandable={this.expandable}
                rowClassName={(record, index) => this.getRowClass(record)}
            />
            <Modal className="firstcap" bodyStyle={{textTransform: 'none'}} title={(this.state as ProcessTreeState).modalTitle} visible={(this.state as ProcessTreeState).modalVisible} onCancel={this.hideModal.bind(this)} footer={[
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
        if (this.props.pollForData && !this.resizing) {
            const procModel = await getAPI().getProcessTree();
            this.setState({ tree: procModel });
        }
    }

    async showInfo(item: any) {
        const info = await getAPI().getItemInfo(item.identity, item.entityType);
        this.showModal(`${item.entityType} Info`, JSON.stringify(info, null, 4));
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

    setSize() {
        let h = document.body.clientHeight - this.props.headerHeight;
        this.setState({scrollY: h});
    }

    getRowClass(record) {
        return `row_${record.identity.entityType}`
    }
}