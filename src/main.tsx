import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Tabs } from 'antd';

import { ProcessList } from './ProcessList';
import { LogList } from './LogList';

import 'antd/dist/antd.less';

interface AppProps {
    
}
interface AppState {
    pollProcesses: boolean;
    pollLogs: boolean;
}

export class App extends React.Component<AppProps, {}> {

    constructor(props) {
        super(props);
        this.state = {pollProcesses: true};
    }

    onTabChange(key) {
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
    }

    render() {
        const TabPane = Tabs.TabPane;
        return <Tabs onChange={this.onTabChange.bind(this)} type="card">
            <TabPane tab="Processes" key="1"><ProcessList polling={(this.state as AppState).pollProcesses}></ProcessList></TabPane>
            <TabPane tab="Logs" key="2"><LogList polling={(this.state as AppState).pollLogs}></LogList></TabPane>
            <TabPane tab="Cache" key="3">Ca$h M0n3y</TabPane>
        </Tabs>;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keyup', (e) => {
        if (e.keyCode === 27) {
            const appInfoDiv = document.getElementById('appDetails');
            if (appInfoDiv) {
                appInfoDiv.classList.remove('showing');
            }
        }
    });

    const root = document.getElementById('content');
    ReactDOM.render(<App></App>, root);
});