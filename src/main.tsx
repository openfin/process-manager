import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Tabs } from 'antd';

import { ProcessList } from './ProcessList';
import { LogList } from './LogList';
import { ServiceList } from './ServiceList';
import { WindowList } from './WindowList';

import 'antd/dist/antd.less';

interface AppProps {
    
}
interface AppState {
    pollProcesses: boolean;
    pollLogs: boolean;
    pollServices: boolean;
    pollWindows: boolean;
}

export class App extends React.Component<AppProps, {}> {

    constructor(props) {
        super(props);
        this.state = {pollProcesses: true};
    }

    onTabChange(key) {
        // there's gotta be a better way, but always bigger fish to fry mmmmmmm...
        if (key === "1") {
            this.setState({pollProcesses: true});
        } else {
            this.setState({pollProcesses: false});
        }
        if (key === "2") {
            this.setState({pollLogs: true});
        } else {
            this.setState({pollLogs: false});
        }
        if (key === "3") {
            this.setState({pollWindows: true});
        } else {
            this.setState({pollWindows: false});
        }
        if (key === "4") {
            this.setState({pollServices: true});
        } else {
            this.setState({pollServices: false});
        }
    }

    render() {
        const TabPane = Tabs.TabPane;
        return <Tabs onChange={this.onTabChange.bind(this)} type="card">
            <TabPane tab="Applications" key="1"><ProcessList polling={(this.state as AppState).pollProcesses}></ProcessList></TabPane>
            <TabPane tab="Logs" key="2"><LogList polling={(this.state as AppState).pollLogs}></LogList></TabPane>
            <TabPane tab="Windows" key="3"><WindowList polling={(this.state as AppState).pollWindows}></WindowList></TabPane>
            <TabPane tab="Services" key="4"><ServiceList polling={(this.state as AppState).pollServices}></ServiceList></TabPane>
        </Tabs>;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    document.addEventListener('keyup', (e) => {
        if (e.keyCode === 27) {
            const appInfoDiv = document.getElementById('appDetails');
            if (appInfoDiv) {
                appInfoDiv.classList.remove('showing');
            }
            const winInfoDiv = document.getElementById('winDetails');
            if (winInfoDiv) {
                winInfoDiv.classList.remove('showing');
            }
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

    const monInfo = await fin.System.getMonitorInfo();
    console.log(`got monitor info: ${JSON.stringify(monInfo,null, 4)}`);


});