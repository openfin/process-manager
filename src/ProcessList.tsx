import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

interface AppProcessInfo {
    process: fin.ProcessInfo;
    info: AppInfo;
}

interface AppInfo {
    runtime: AppVersion;
    manifestUrl: string;
    manifest: Manifest;
}

interface AppVersion {
    version: string;
}

interface Manifest {
    startup_app: StartUpApp;
}

interface StartUpApp {
    url: string;
}

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

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    columns = [
        { Header: 'ID', accessor: 'process.processId', maxWidth: 70, className: 'cell-center'},
        { Header: 'Application', id: 'name', headerStyle: { textAlign: "left" }, minWidth: 150, accessor: (inf) => {
            return inf.process.uuid || inf.process.name || '';
        }},
        { Header: 'URL', headerStyle: { textAlign: "left" }, accessor: 'info.manifest.startup_app.url', minWidth: 270},
        { Header: 'Manifest', headerStyle: { textAlign: "left" }, accessor: 'info.manifestUrl', minWidth: 270},
        { Header: 'Runtime', accessor: 'info.runtime.version', maxWidth: 160, className: 'cell-center'},
        { Header: 'CPU', accessor: 'process.cpuUsage', maxWidth: 70, className: 'cell-center'},
        { Header: 'Mem', id: 'mem', maxWidth: 70, className: 'cell-center', accessor: (inf) => {
            const mem = inf.process.workingSetSize||0.00;
            return (mem/1000000).toFixed(2) + ' MB';
        }},
        { Header: 'Actions', maxWidth: 220, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button type="primary" icon="code" onClick={(e) => this.launchDebugger(cellInfo.original.process)}></Button>
                <Button type="primary" icon="info-circle" onClick={(e) => this.showAppInfo(cellInfo.original.process)}></Button>
                <Button type="primary" icon="close-circle" onClick={(e) => this.closeApp(cellInfo.original.process)}></Button>
            </ButtonGroup>
        )}
    ];

    componentDidMount() {
        this.timer = window.setInterval(
            () => this.pollForApps(),
            1000
        );
    }
    
    componentWillUnmount() {
        window.clearInterval(this.timer);
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
                    const appInf = await new Promise((res, rej) => {
                        fin.desktop.Application.wrap(proc.uuid || '').getInfo(res, rej);
                    });
                    this.processCache[proc.uuid || ''] = appInf as AppInfo;
                    procList[procList.length] = { process: proc, info: appInf as AppInfo};
                }
                this.setState({data: procList});
            });
        }
    }
}

