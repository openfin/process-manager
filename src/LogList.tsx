import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import {formatBytes} from './utils';

interface LogListProps {
    polling?: boolean;
}

interface LogFile {
    fileName: string;
    formattedDate: string;
    date: Date;
    size: number;
    formattedSize: string;
}

interface LogListState {
    logs: LogFile[];
}

/* tslint:disable-next-line */
const ButtonGroup = Button.Group;

export class LogList extends React.Component<LogListProps, {}> {

    timer = 0;
    
    columns = [
        { Header: 'Date/Time', headerStyle: { textAlign: "left" }, accessor: 'formattedDate', maxWidth: 250},
        { Header: 'Filename', headerStyle: { textAlign: "left" }, accessor: 'fileName', minWidth: 300},
        { Header: 'Size', accessor: 'formattedSize', maxWidth: 100, className: 'cell-center'},
        { Header: 'Actions', maxWidth: 100, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button type="primary" icon="exception" onClick={(e) => this.showLog(cellInfo.original)}></Button>
                <Button type="primary" icon="mail" onClick={(e) => this.emailLog(cellInfo.original)}></Button>
            </ButtonGroup>
        )}
    ];

    constructor(props) {
        super(props);
        this.state = { logs: [] };
    }

    componentDidMount() {
        this.timer = window.setInterval(
            () => this.pollForLogs(),
            1000
        );
    }
    
    componentWillUnmount() {
        window.clearInterval(this.timer);
    }


    render() {
        return <ReactTable
            data={(this.state as LogListState).logs}
            columns={this.columns}
            minRows={15}
            showPagination={false}
            style={{
                height: "calc(100vh - 79px)"
            }}
            className="-striped -highlight"
        />;
    }

    showLog(log:LogFile) {
        const opts: fin.WindowOptions = {name: log.fileName, autoShow: true, url: 'log.html', defaultWidth: 600, defaultHeight: 400};
        const logWin: fin.OpenFinWindow = new fin.desktop.Window(opts, () => {
            logWin.getNativeWindow().postMessage(log.fileName, '*');
        }, (e) => console.error('error loading log file' + e));
    }

    emailLog(log:LogFile) {
        // TODO somehow mail this thing?
        // create hidden href with mailto proto and programitcally click it ?
        console.log(`emailing log ${log.fileName}`)
    }

    private pollForLogs() {
        if (this.props.polling) {
            const logList:LogFile[] = [];

            fin.desktop.System.getLogList((list) => {
                const newList = this.processLogList(list);
                for (let i = 0; i < newList.length; i++) {
                    const log = newList[i];
                    logList[logList.length] = log;
                }
                this.setState({logs: logList});
            });
        }
    }
    
    private processLogList(list: fin.LogInfo[]): LogFile[] {
        const results = new Array<LogFile>();
        for (let i = 0; i < list.length; i++) {
            const log = list[i];
            results[results.length] = this.makeProcessedLogInfo(log);
        }
        results.sort((a: LogFile, b: LogFile) => {
            if (a.date === b.date) {
                return 0;
            }
            return (a.date > b.date) ? -1 : 1;
        });
        return results;
    }

    private makeProcessedLogInfo(log: fin.LogInfo): LogFile {
        const dateOpts = {year: 'numeric', month: '2-digit', day: '2-digit'};
        const timeOpts = {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'};
        const logDate = new Date(Date.parse(log.date || ''));
        const logSize = log.size || 0;
        const newInfo = {
            fileName: log.name || '',
            size: logSize,
            formattedSize: formatBytes(logSize, 1),
            date: logDate,
            formattedDate: logDate.toLocaleDateString('en-US', dateOpts) + ' ' + logDate.toLocaleTimeString('en-US', timeOpts)
        };
        return newInfo;
    }
}