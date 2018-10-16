import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';
import {formatBytes} from './utils'


interface ProcessListProps {
    polling?: boolean;
}
interface ProcessInfoState {
    data: AppProcessInfo[];
}

/* tslint:disable-next-line */
const ButtonGroup = Button.Group;

export class ProcessList extends React.Component<ProcessListProps, {}> {

    timer = 0;
    processCache: {[key:string]:AppInfo} = {};

    static closeAllApps() {
        fin.desktop.System.getProcessList(async (list) => {
            for (let i = 0; i < list.length; i++) {
                const uuid = list[i].uuid||'';
                if (uuid !== '' && uuid !== 'process-manager') {
                    fin.desktop.Application.wrap(uuid).close(true);
                }
            }
        });
    }

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    columns = [
        { Header: 'ID', accessor: 'process.processId', width: 50, className: 'cell-center'},
        { 
            Header: 'Application', id: 'name', headerStyle: { textAlign: "left" }, minWidth: 150, accessor: (inf) => {
                if (inf.parentUUID!= '' && inf.parentUUID != inf.process.uuid) {
                    return ` - ${inf.process.uuid} (${inf.parentUUID})`;
                } else {
                    return inf.process.uuid;
                }
            },
            Cell: c => <div className="cell-overflow" title={c.value}>{c.value}</div>
        },
        { Header: 'URL', headerStyle: { textAlign: "left" }, accessor: 'info.manifest.startup_app.url', minWidth: 200, Cell: c => <div className="cell-overflow"title={c.value}>{c.value}</div>},
        { Header: 'Manifest', headerStyle: { textAlign: "left" }, accessor: 'info.manifestUrl', minWidth: 200, Cell: c => <div className="cell-overflow"title={c.value}>{c.value}</div>},
        { Header: 'Runtime', accessor: 'info.runtime.version', width: 80, className: 'cell-center'},
        { Header: 'CPU', accessor: 'process.cpuUsage', width: 50, className: 'cell-center'},
        { Header: 'Mem', id: 'mem', width: 50, className: 'cell-center', accessor: (inf) => {
            return formatBytes(inf.process.workingSetSize||0.00, 1);
        }},
        { Header: 'Actions', width: 100, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button title="Launch Debugger" type="primary" icon="code" onClick={(e) => this.launchDebugger(cellInfo.original.process)}></Button>
                <Button title="Show App Info" type="primary" icon="info-circle" onClick={(e) => this.showAppInfo(cellInfo.original.process)}></Button>
                <Button title="Close App" type="primary" icon="close-circle" onClick={(e) => this.closeApp(cellInfo.original.process)}></Button>
            </ButtonGroup>
        )}
    ];

    componentDidMount() {
        this.startPolling();
    }
    
    componentWillUnmount() {
        this.stopPolling();
    }

    render() {
        return <ReactTable
            data={(this.state as ProcessInfoState).data}
            columns={this.columns}
            minRows={15}
            showPagination={false}
            style={{
                height: "calc(100vh - 79px)"
            }}
            className="-striped -highlight"
       />;
    }

    startPolling() {
        this.pollForApps();
        this.timer = window.setInterval( () => this.pollForApps(), 1000 );
    }

    stopPolling() {
        window.clearInterval(this.timer);
    }

    launchDebugger(proc):void {
        fin.desktop.System.showDeveloperTools(proc.uuid || '', proc.name || '', console.log, console.error);
    }

    showAppInfo(proc:fin.ProcessInfo) {
        const appInfoDiv = document.getElementById('appDetails');
        if (appInfoDiv) {
            appInfoDiv.innerHTML = JSON.stringify(this.processCache[proc.uuid||''].manifest, null, 4);
            appInfoDiv.classList.add('showing');
        }
    }

    closeApp(proc:fin.ProcessInfo) {
        console.log('closing app ' + proc.uuid);
        fin.desktop.Application.wrap(proc.uuid||'').close();
    }

    private pollForApps() {
        if (this.props.polling) {
            const procList:AppProcessInfo[] = [];
            fin.desktop.System.getProcessList(async (list) => {
                for (let i = 0; i < list.length; i++) {
                    const proc = list[i];
                    const app = fin.desktop.Application.wrap(proc.uuid||'');
                    const appInf = await new Promise((res, rej) => {
                        app.getInfo(res, rej);
                    });
                    let appParent = '';
                    try {
                        appParent = await new Promise<string>((res, rej) => {
                            app.getParentUuid(res, rej);
                        });
                    } catch(e) {
                        //console.log('no parent app for: '+ proc.uuid);
                    }
                    this.processCache[proc.uuid || ''] = appInf as AppInfo;
                    procList[procList.length] = { process: proc, info: appInf as AppInfo, parentUUID: appParent};
                }
                this.setState({data: procList});
            });
        }
    }
}

