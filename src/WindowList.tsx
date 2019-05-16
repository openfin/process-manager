import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';
import { WindowDetail } from 'openfin/_v2/api/system/window';
import { EntityInfo } from 'openfin/_v2/api/system/entity';

interface WindowListProps {
    polling?: boolean;
}
interface WindowInfoState {
    data: WindowDetails[];
}

interface WindowDetails extends WindowDetail {
    uuid: string;
    name: string;
    url: string;
    parentName: string;
    parentUUID: string;
    childCount: number;
    windowInfo: WindowInfo;
    showing: boolean;
}

interface WindowInfo {
    monitor: string;
    position: string;
    size: string;
}

/* tslint:disable-next-line */
const ButtonGroup = Button.Group;

export class WindowList extends React.Component<WindowListProps, {}> {

    timer = 0;

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    columns = [
        { 
            Header: 'Window', id: 'name', minWidth: 200, headerStyle: { textAlign: "left" }, accessor: (inf) => {
                if (inf.parentName) {
                    return ` - ${inf.name} (${inf.parentName})`;
                } else if (inf.name && inf.name !== '') {
                    return inf.name;
                } else {
                    return inf.uuid;
                }
            },
            Cell: c => <div className="cell-overflow" title={c.value}>{c.value}</div>
        },
        { Header: 'URL', minWidth: 200, headerStyle: { textAlign: "left" }, accessor: 'url', Cell: c => <div className="cell-overflow" title={c.value}>{c.value}</div>},
        { Header: 'Showing', width: 60, id: 'showing', className: 'cell-center', accessor: (inf) => {
            if (inf.showing) {
                return 'Yes';
            } else {
                return 'No';
            }
        }},
        { Header: 'Position', width: 180, id: 'position', className: 'cell-center', accessor: (inf) => {
            let sizeInfo = '';
            if (inf.windowInfo && inf.windowInfo.size && inf.windowInfo.position) {
                sizeInfo += `${inf.windowInfo.size} at ${inf.windowInfo.position}`;
            }
            return sizeInfo;
        }},
        { Header: 'Children', width: 60, className: 'cell-center', accessor: 'childCount'},
        { Header: 'Actions', width: 135, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button title="Launch Debugger" type="primary" icon="code" onClick={(e) => this.launchDebugger(cellInfo.original)}></Button>
                <Button title="Rescue Offscreen Window" type="primary" icon="medicine-box" onClick={(e) => this.centerWindow(cellInfo.original)}></Button>
                <Button title="Show Window Info" type="primary" icon="info-circle" onClick={(e) => this.showWindowInfo(cellInfo.original)}></Button>
                <Button title="Close Window" type="primary" icon="close-circle" onClick={(e) => this.closeWindow(cellInfo.original)}></Button>
            </ButtonGroup>
        )}
    ];

    componentDidMount() {
        this.pollForWindows();
        this.timer = window.setInterval( () => this.pollForWindows(), 1000 );
    }
    
    componentWillUnmount() {
        window.clearInterval(this.timer);
    }

    render() {
        return <ReactTable
            data={(this.state as WindowInfoState).data}
            columns={this.columns}
            minRows={15}
            showPagination={false}
            style={{
                height: "calc(100vh - 79px)"
            }}
            className="-striped -highlight"
       />;
    }

    launchDebugger(win:WindowDetails):void {
        console.log('showing dev tools for window: ' + JSON.stringify(win));
        fin.System.showDeveloperTools({ uuid: win.uuid||'', name: win.name||''});
    }

    async centerWindow(win:WindowDetails) {
        console.log('centering window: ' + JSON.stringify(win));
        const ofwin = await fin.Window.wrap({ uuid: win.uuid||'', name: win.name||''});
        ofwin.moveTo(100, 100);
        ofwin.focus();
        ofwin.bringToFront();
    }

    showWindowInfo(win:WindowDetails) {
        console.log('showing window info: ' + JSON.stringify(win));
        const winInfoDiv = document.getElementById('winDetails');
        if (winInfoDiv) {
            winInfoDiv.classList.add('showing');
            const winInfoDivContent = document.getElementById('winDetailsContent');
            if (winInfoDivContent) {
                winInfoDivContent.innerHTML = JSON.stringify(win, null, 4);
            }
        }
    }

    async closeWindow(win:WindowDetails) {
        console.log('closing window: ' + JSON.stringify(win));
        const w = await fin.Window.wrap({ uuid: win.uuid||'', name: win.name||''});
        w.close();
    }

    getWindowPositionInfo(win:WindowDetail) {
        const info = {
            size: '',
            position: `(${win.top},${win.left})`,
            monitor: ''
        };
        if (typeof win.top !== 'undefined' && typeof win.bottom !== 'undefined' && typeof win.left !== 'undefined' && typeof win.right !== 'undefined') {
            info.size = `${win.right - win.left}w${win.bottom - win.top}h`;
        }
        return info;
    }

    private async pollForWindows() {
        if (this.props.polling) {
            const winList:WindowDetails[] = [];
            const list = await fin.System.getAllWindows();
            const allWins = list.map(w => [w.mainWindow!].concat(w.childWindows!).map(cw => 
                Object.assign(cw, {
                    uuid: w.uuid!, 
                    name: cw.name || '',
                    url: '', 
                    parentName: '', 
                    parentUUID: '', 
                    childCount: w.childWindows!.length,
                    windowInfo: this.getWindowPositionInfo(cw),
                    showing: true
                }))
            ).reduce( (p,c) => p.concat(c), []);
            for (const w of allWins) {
                const fInfo:EntityInfo = await new Promise<EntityInfo>(r => fin.desktop.Frame.wrap(w.uuid!, w.name!).getInfo(r));
                w.parentName = fInfo.parent.name||'';
                w.parentUUID = fInfo.parent.uuid;
                const ofWin = await fin.Window.wrap(w);
                const info = await ofWin.getInfo();
                w.url = info.url;
                w.showing = await ofWin.isShowing();
                winList.push(w);
            }
            this.setState({ data: winList });
        }
    }
}

