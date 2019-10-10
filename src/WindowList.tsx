import * as React from 'react';
import ReactTable from 'react-table';
import treeTableHOC from 'react-table/lib/hoc/treeTable';

import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';
import { WindowDetail } from 'openfin/_v2/api/system/window';
import { Bounds } from 'openfin/_v2/shapes';
import { _Window } from 'openfin/_v2/api/window/window';

const TreeTable = treeTableHOC(ReactTable);

interface WindowListProps {
    polling?: boolean;
}
interface WindowInfoState {
    data: WindowDetails2[];
    expanded: {}
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

interface ParentWindow {
    uuid: string;
    name: string;
    url: string;
    parentName: string;
    parentUUID: string;
    childCount: number;
    windowInfo: WindowInfo;
    showing: boolean;
    subRows: WindowDetails2[]
}

interface WindowDetails2 {
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
    UUID = '';
    
    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
        this.UUID = fin.Application.getCurrentSync().identity.uuid;
    }

    columns = [
        { 
            Header: 'UUID', headerStyle: { textAlign: "left" }, width: 200, accessor:'parentUUID',
            Cell: c => <div className="cell-overflow" title={c.value}>{c.value}</div>
        },
        { 
            Header: 'Window', id: 'name', minWidth: 180, headerStyle: { textAlign: "left" }, accessor: (inf) => {
                if (inf.parentName && inf.parentName !== inf.name) {
                    return ` - ${inf.name}`;
                } else if (inf.name && inf.name !== '') {
                    return inf.name;
                } else {
                    return inf.uuid;
                }
            },
            Cell: c => <div className="cell-overflow" title={c.value}>{c.value}</div>
        },
        { 
            Header: 'URL', 
            minWidth: 180, 
            headerStyle: { textAlign: "left" }, 
            accessor: 'url', 
            Cell: c => <div className="cell-overflow" title={c.value}>{c.value}</div>
        },
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
        { Header: 'Actions', width: 170, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button href="#" title="Launch Debugger" type="primary" icon="code" onClick={(e) => this.launchDebugger(cellInfo.original)}></Button>
                <Button href="#" title="Rescue Offscreen Window" type="primary" icon="medicine-box" onClick={(e) => this.rescueWindow(cellInfo.original)}></Button>
                <Button href="#" title="Show Window" type="primary" disabled={this.getShowWindowDisabled(cellInfo.original)} icon={this.getShowWindowIcon(cellInfo.original)} onClick={(e) => this.showWindow(cellInfo.original)}></Button>
                <Button href="#" title="Show Window Info" type="primary" icon="info-circle" onClick={(e) => this.showWindowInfo(cellInfo.original)}></Button>
                <Button href="#" title="Close Window" type="primary" disabled={this.getShowWindowDisabled(cellInfo.original)} icon="close-circle" onClick={(e) => this.closeWindow(cellInfo.original)}></Button>
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
        return <TreeTable
            data={(this.state as WindowInfoState).data}
            columns={this.columns}
            minRows={15}
            multiSort={false}
            showPagination={false}
            style={{
                height: "calc(100vh - 79px)"
            }}
            className="-striped -highlight"
            pivotBy={["parentUUID"]}
            onExpandedChange={newExpanded => this.onExpandedChange(newExpanded)}
            expanded={(this.state as WindowInfoState).expanded}
       />;
    }

    onExpandedChange(newExpanded) {
        this.setState({
          expanded: newExpanded
        });
    }

    getShowWindowIcon(win:WindowDetails) {
        return (win.showing) ? 'eye-invisible' : 'eye';
    }
    
    launchDebugger(win:WindowDetails):void {
        console.log('showing dev tools for window: ' + JSON.stringify(win));
        fin.System.showDeveloperTools({ uuid: win.uuid||'', name: win.name||''});
    }

    async rescueWindow(win:WindowDetails) {
        console.log('rescueing window: ' + JSON.stringify(win));
        const ofwin = await fin.Window.wrap({ uuid: win.uuid||'', name: win.name||''});
        ofwin.moveTo(100, 100);
        ofwin.focus();
        ofwin.bringToFront();
    }

    async showWindow(win:WindowDetails) {
        // don't toggle our own visibility !!
        if (this.UUID !== win.uuid) {
            if (win.showing) {
                console.log('showing window: ' + JSON.stringify(win));
                const ofwin = await fin.Window.wrap({ uuid: win.uuid||'', name: win.name||''});
                ofwin.hide();
            } else {
                console.log('showing window: ' + JSON.stringify(win));
                const ofwin = await fin.Window.wrap({ uuid: win.uuid||'', name: win.name||''});
                ofwin.show();
                ofwin.focus();
                ofwin.bringToFront();    
            }
        }
    }

    getShowWindowDisabled(win:WindowDetails):boolean {
        return (this.UUID === win.uuid);
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

    getWindowPositionInfo2(win:Bounds) {
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

    private async makeWindowInfo(win:_Window, childCount:number):Promise<WindowDetails2> {
        const winfo = await win.getInfo();
        const parWin = await win.getParentWindow()
        const bounds = await win.getBounds();
        const isShowing = await win.isShowing();
        const w = Object.assign({}, {
            uuid: win.identity.uuid!, 
            name: win.identity.name!,
            url: winfo.url, 
            parentName: parWin.identity.name!,
            parentUUID: parWin.identity.uuid, 
            childCount: childCount,
            windowInfo: this.getWindowPositionInfo2(bounds),
            showing: isShowing
        });
        return w;
    }

    private async pollForWindows() {
        if (this.props.polling) {
            let winList2:ParentWindow[] = [];
            const apps = await fin.System.getAllApplications();
            for (let i=0; i<apps.length; i++) {
                const appInfo = apps[i];
                try {
                    const app = fin.Application.wrapSync(appInfo);
                    const mWin = await app.getWindow();
                    const wins = await app.getChildWindows();
                    const mWinfo = await this.makeWindowInfo(mWin, wins.length);
                    const childs:WindowDetails2[] = [];
                    for(let j=0; j<wins.length; j++) {
                        const win = wins[j];
                        const w = await this.makeWindowInfo(win, wins.length);
                        childs.push(w);
                    }
                    const wchilds = Object.assign(mWinfo, { subRows: childs});
                    winList2.push(wchilds);
                } catch(e) {
                    console.error(`error polling for apps, problem app uuid: ${appInfo.uuid}`, e);
                }
            }
            // sort list by main windows
            winList2 = winList2.sort( (a,b) => {
                return a.parentUUID.localeCompare(b.parentUUID);
            });
            // flatten for list
            const newList:WindowDetails2[] = [];
            for (let i=0; i<winList2.length; i++) {
                const w = winList2[i];
                newList.push(w);
                for (let j=0; j<w.subRows.length; j++) {
                    newList.push(w.subRows[j]);
                }
            }
            this.setState({ data: newList });
        }
    }
}

