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

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    columns = [
        { Header: 'ID', accessor: 'process.processId', maxWidth: 70, className: 'cell-center'},
        { Header: 'Application', id: 'name', headerStyle: { textAlign: "left" }, minWidth: 150, accessor: (inf) => {
            if (inf.parentUUID!= '' && inf.parentUUID != inf.process.uuid) {
                return ` - ${inf.process.uuid} (${inf.parentUUID})`;
            } else {
                return inf.process.uuid;
            }
        }},
        { Header: 'URL', headerStyle: { textAlign: "left" }, accessor: 'info.manifest.startup_app.url', minWidth: 270},
        { Header: 'Manifest', headerStyle: { textAlign: "left" }, accessor: 'info.manifestUrl', minWidth: 270},
        { Header: 'Runtime', accessor: 'info.runtime.version', maxWidth: 160, className: 'cell-center'},
        { Header: 'CPU', accessor: 'process.cpuUsage', maxWidth: 70, className: 'cell-center'},
        { Header: 'Mem', id: 'mem', maxWidth: 70, className: 'cell-center', accessor: (inf) => {
            return formatBytes(inf.process.workingSetSize||0.00, 1);
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
        this.timer = window.setInterval( () => this.pollForApps(), 1000 );
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

