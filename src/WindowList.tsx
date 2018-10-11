import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';
import { _Window } from 'openfin/_v2/api/window/window';

interface WindowListProps {
    polling?: boolean;
}
interface WindowInfoState {
    data: windowDetails[];
}

interface windowDetails extends fin.WindowDetails {
    uuid: string;
    name: string;
    url: string;
    parentName: string;
    parentUUID: string;
    childCount: number;
    windowInfo: windowInfo;
    showing: boolean;
}

interface windowInfo {
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
        { Header: 'Window', id: 'name', minWidth: 270, headerStyle: { textAlign: "left" }, accessor: (inf) => {
            if (inf.parentName) {
                return ` - ${inf.name} (${inf.parentName})`;
            } else if (inf.name && inf.name != '') {
                return inf.name;
            } else {
                return inf.uuid;
            }
        }},
        { Header: 'URL', minWidth: 270, headerStyle: { textAlign: "left" }, accessor: 'url'},
        { Header: 'Showing', width: 80, id: 'showing', accessor: (inf) => {
            if (inf.showing) {
                return 'Yes';
            } else {
                return 'No';
            }
        }},
        { Header: 'Position', width: 220, id: 'position', accessor: (inf) => {
            let sizeInfo = '';
            if (inf.windowInfo && inf.windowInfo.size && inf.windowInfo.position) {
                sizeInfo += `${inf.windowInfo.size} at ${inf.windowInfo.position}`;
            }
            return sizeInfo;
        }},
        { Header: 'Children', width: 80, className: 'cell-center', accessor: 'childCount'},
        { Header: 'Actions', width: 150, className: 'cell-center', Cell: cellInfo => (
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

    launchDebugger(win:windowDetails):void {
        console.log('showing dev tools for window: ' + JSON.stringify(win));
        fin.desktop.System.showDeveloperTools(win.uuid||'', win.name||'', console.log, console.error);
    }

    centerWindow(win:windowDetails) {
        console.log('centering window: ' + JSON.stringify(win));
        const ofwin = fin.desktop.Window.wrap(win.uuid||'', win.name||'');
        ofwin.moveTo(100, 100);
        ofwin.focus();
        ofwin.bringToFront();
    }

    showWindowInfo(win:windowDetails) {
        console.log('showing window info: ' + JSON.stringify(win));
        const winInfoDiv = document.getElementById('winDetails');
        if (winInfoDiv) {
            winInfoDiv.innerHTML = JSON.stringify(win, null, 4);
            winInfoDiv.classList.add('showing');
        }
    }

    closeWindow(win:windowDetails) {
        console.log('closing window: ' + JSON.stringify(win));
        fin.desktop.Window.wrap(win.uuid||'', win.name||'').close();
    }

    getWindowPositionInfo(win:fin.WindowInfo) {
        const info = {
            size: '',
            position: `${win.top}, ${win.left}`,
            monitor: ''
        };
        if (typeof win.top !== 'undefined' && typeof win.bottom !== 'undefined' && typeof win.left !== 'undefined' && typeof win.right !== 'undefined') {
            info.size = `${win.right - win.left}w x ${win.bottom - win.top}h`;
        }
        return info;
    }

    private pollForWindows() {
        if (this.props.polling) {
            const winList:windowDetails[] = [];
            fin.desktop.System.getAllWindows(async (list) => {

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

                for (let w of allWins) {
                    const fInfo:fin.EntityInfo = await new Promise<fin.EntityInfo>(r => fin.desktop.Frame.wrap(w.uuid!, w.name!).getInfo(r));
                    w.parentName = fInfo.parent.name;
                    w.parentUUID = fInfo.parent.uuid;
                    const ofWin = await fin.Window.wrap(w);
                    const info = await ofWin.getInfo();
                    w.url = info.url;
                    w.showing = await ofWin.isShowing();
                    winList.push(w);
                }

                this.setState({data: winList});
            });
        }
    }
}

