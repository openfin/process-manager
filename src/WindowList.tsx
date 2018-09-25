import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';

interface WindowListProps {
    polling?: boolean;
}
interface WindowInfoState {
    data: fin.WindowDetails[];
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
        { Header: 'App / Window', id: 'name', headerStyle: { textAlign: "left" }, accessor: (inf) => {
            return inf.uuid + ' / ' + inf.mainWindow.name;
        }},
        { Header: 'Children', id: 'childs', headerStyle: { textAlign: "left" }, accessor: (inf) => {
            return inf.childWindows.length;
        }},
        { Header: 'Actions', maxWidth: 220, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button type="primary" icon="medicine-box" onClick={(e) => this.centerWindow(cellInfo.original)}></Button>
                <Button type="primary" icon="info-circle" onClick={(e) => this.showWindowInfo(cellInfo.original)}></Button>
                <Button type="primary" icon="close-circle" onClick={(e) => this.closeWindow(cellInfo.original)}></Button>
            </ButtonGroup>
        )}
    ];

    componentDidMount() {
        this.timer = window.setInterval(
            () => this.pollForWindows(),
            1000
        );
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

    centerWindow(win:fin.WindowDetails) {
        console.log('centering window: ' + JSON.stringify(win));
        fin.desktop.Window.wrap(win.uuid||'', (win.mainWindow) ? win.mainWindow.name ||'' : '').moveTo(100, 100);
    }

    showWindowInfo(win:fin.WindowDetails) {
        console.log('showing window info: ' + JSON.stringify(win));
        const winInfoDiv = document.getElementById('winDetails');
        if (winInfoDiv) {
            winInfoDiv.innerHTML = JSON.stringify(win, null, 4);
            winInfoDiv.classList.add('showing');
        }
    }

    closeWindow(win:fin.WindowDetails) {
        console.log('closing window: ' + JSON.stringify(win));
        fin.desktop.Window.wrap(win.uuid||'', (win.mainWindow) ? win.mainWindow.name ||'' : '').close();
    }

    private pollForWindows() {
        if (this.props.polling) {
            const winList:fin.WindowDetails[] = [];
            fin.desktop.System.getAllWindows(async (list) => {
                for (let i = 0; i < list.length; i++) {
                    const win = list[i];
                    console.log('got a window: ' + JSON.stringify(win));
                    winList[winList.length] = win;
                }
                this.setState({data: winList});
            });
        }
    }
}

