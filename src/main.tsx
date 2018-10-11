import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Tabs } from 'antd';

import { ProcessList } from './ProcessList';
import { LogList } from './LogList';
import { ServiceList } from './ServiceList';
import { WindowList } from './WindowList';
import { Workspace } from './Workspace'

import 'antd/dist/antd.less';

interface AppProps {
    
}
interface AppState {
    pollProcesses: boolean;
    pollLogs: boolean;
    pollServices: boolean;
    pollWindows: boolean;
    contentHeight: number;
    contentWidth: number;
}

const hideInfoWindows = () => {
    const appInfoDiv = document.getElementById('appDetails');
    if (appInfoDiv) {
        appInfoDiv.classList.remove('showing');
    }
    const winInfoDiv = document.getElementById('winDetails');
    if (winInfoDiv) {
        winInfoDiv.classList.remove('showing');
    }
}

export class App extends React.Component<AppProps, {}> {

    constructor(props) {
        super(props);
        this.state = {pollProcesses: true, contentHeight: 600, contentWidth: 800};
    }

    componentDidMount() {
        const w = document.body.clientWidth;
        const h = document.body.clientHeight;
        this.setState({contentHeight: h-80, contentWidth: w-20});

    }

    onTabChange(key) {
        hideInfoWindows();
        this.setState({pollProcesses: key === "1"});
        this.setState({pollLogs: key === "2"});
        this.setState({pollWindows: (key === "3" || key === "4")});
        this.setState({pollServices: key === "5"});
    }

    render() {
        const TabPane = Tabs.TabPane;
        return <Tabs onChange={this.onTabChange.bind(this)} type="card">
            <TabPane tab="Applications" key="1"><ProcessList polling={(this.state as AppState).pollProcesses}></ProcessList></TabPane>
            <TabPane tab="Logs" key="2"><LogList polling={(this.state as AppState).pollLogs}></LogList></TabPane>
            <TabPane tab="Windows" key="3"><WindowList polling={(this.state as AppState).pollWindows}></WindowList></TabPane>
            <TabPane tab="Workspace" key="4"><Workspace height={(this.state as AppState).contentHeight} width={(this.state as AppState).contentWidth} polling={(this.state as AppState).pollWindows}></Workspace></TabPane>
            <TabPane tab="Services" key="5"><ServiceList polling={(this.state as AppState).pollServices}></ServiceList></TabPane>
        </Tabs>;
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    document.addEventListener('keyup', (e) => {
        if (e.keyCode === 27) {
            hideInfoWindows();
        }
    });

    const root = document.getElementById('content');
    ReactDOM.render(<App></App>, root);

    fin.desktop.System.getRvmInfo( (info) => {
        const header = document.getElementById('rvmVersion');
        if (header) {
            header.innerHTML = 'RVM: ' + info.version;
        }
    });

    // diagnostic events - console.log'ed for now
    fin.System.addListener('application-started', (evt) => {
        console.log(`application-started: ${JSON.stringify(evt, null, 4)}`);
    });

    fin.System.addListener('monitor-info-changed', (evt) => {
        console.log(`monitor-info-changed: ${JSON.stringify(evt, null, 4)}`);
    });

    fin.System.addListener('application-closed', (evt) => {
        console.log(`application-closed: ${JSON.stringify(evt, null, 4)}`);
    });

    fin.System.addListener('window-created', (evt) => {
        console.log(`window-created: ${JSON.stringify(evt, null, 4)}`);
    });
});