import * as React from 'react';
import ReactTable from 'react-table';
import { Button } from 'antd';

import 'react-table/react-table.css';

import './interfaces';
import { ProviderIdentity } from 'openfin/_v2/api/interappbus/channel/channel';

interface ServiceListProps {
    polling?: boolean;
}

interface ServiceListState {
    data: ProviderIdentity[];
}

/* tslint:disable-next-line */
const ButtonGroup = Button.Group;

export class ServiceList extends React.Component<ServiceListProps, {}> {

    timer = 0;

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    columns = [
        { Header: 'Service', headerStyle: { textAlign: "left" }, id: 'name', accessor: (inf) => {
            if (inf.name && inf.name !== '') {
                return inf.name;
            } else {
                return inf.uuid;
            }
        }},
        { Header: 'Channel Name', headerStyle: { textAlign: "left" }, accessor: 'channelName'},
        { Header: 'Channel ID', headerStyle: { textAlign: "left" }, accessor: 'channelId', minWidth: 300},
        { Header: 'Actions', width: 100, className: 'cell-center', Cell: cellInfo => (
            <ButtonGroup>
                <Button title="Launch Debugger" type="primary" icon="code" onClick={(e) => this.launchDebugger(cellInfo.original.uuid)}></Button>
            </ButtonGroup>
        )}        
    ];

    componentDidMount() {
        this.startPolling();
    }
    
    componentWillUnmount() {
        this.stopPolling();
    }

    launchDebugger(uuid:string):void {
        fin.System.showDeveloperTools({ uuid});
    }

    startPolling() {
        this.pollForServices();
        this.timer = window.setInterval( () => this.pollForServices(), 1000 );
    }

    stopPolling() {
        window.clearInterval(this.timer);
    }

    render() {
        return <ReactTable
            data={(this.state as ServiceListState).data}
            columns={this.columns}
            minRows={15}
            showPagination={false}
            style={{
                height: "calc(100vh - 79px)"
            }}
            className="-striped -highlight"
       />;
    }

    private async pollForServices() {
        if (this.props.polling) {
            const providers = await fin.InterApplicationBus.Channel.getAllChannels();
            this.setState({data: providers});
        }
    }
}

