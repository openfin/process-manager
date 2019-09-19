import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';
import {formatBytes} from './utils';
import { ProcessInfo } from 'openfin/_v2/api/system/process';


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

    static async closeAllApps() {
        const myUUID = fin.Application.getCurrentSync().identity.uuid;
        const procs = await fin.System.getProcessList();
        for (let i = 0; i < procs.length; i++) {
            const uuid = procs[i].uuid||'';
            if (uuid !== '' && uuid !== myUUID) {
                const app = await fin.Application.wrap({ uuid});
                app.close(true);
            }
        }
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
                if (inf.parentUUID !== '' && inf.parentUUID !== inf.process.uuid) {
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
        { Header: 'CPU', id: 'cpu', width: 50, className: 'cell-center', accessor: (inf) => {
            return (inf.process.cpuUsage||0.0).toFixed(1) + '%';
        }},
        { Header: 'Mem', id: 'mem', width: 60, className: 'cell-center', accessor: (inf) => {
            return formatBytes(inf.process.workingSetSize||0.0, 1);
        }},
        { Header: 'Actions', width: 100, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button href="#" title="Launch Debugger" type="primary" icon="code" onClick={(e) => this.launchDebugger(cellInfo.original.process)}></Button>
                <Button href="#" title="Show App Info" type="primary" icon="info-circle" onClick={(e) => this.showAppInfo(cellInfo.original.process)}></Button>
                <Button href="#" title="Close App" type="primary" icon="close-circle" onClick={(e) => this.closeApp(cellInfo.original.process)}></Button>
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
            defaultSorted={[{id: "name", desc: false}]}
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

    launchDebugger(proc:ProcessInfo):void {
        fin.System.showDeveloperTools({ uuid: proc.uuid||''});
    }

    async showAppInfo(proc:ProcessInfo) {
        const appInfoDiv = document.getElementById('appDetails');
        if (appInfoDiv) {
            appInfoDiv.classList.add('showing');
            const appInfoContent = document.getElementById('appDetailsContent');
            if (appInfoContent) {
                appInfoContent.innerHTML = JSON.stringify(this.processCache[proc.uuid||''].manifest, null, 4);
            }
        }
    }

    async closeApp(proc:ProcessInfo) {
        console.log('closing app ' + proc.uuid);
        const app = await fin.Application.wrap({ uuid: proc.uuid||''});
        app.close();
    }

    private async pollForApps() {
        if (this.props.polling) {
            const procs = await fin.System.getProcessList();
            const procList:AppProcessInfo[] = [];
            for (let i = 0; i < procs.length; i++) {
                const proc = procs[i];
                const app = await fin.Application.wrap({ uuid: proc.uuid||''});
                const appInf = await app.getInfo();
                let appParent = '';
                try {
                    appParent = await app.getParentUuid();
                } catch(e) {
                    //console.log('no parent app for: '+ proc.uuid);
                }
                this.processCache[proc.uuid || ''] = appInf as AppInfo;
                procList[procList.length] = { process: proc, info: appInf as AppInfo, parentUUID: appParent};
            }
            this.setState({data: procList});
        }
    }
}

