import * as React from 'react';
import ReactTable from 'react-table';

import 'react-table/react-table.css';

import './interfaces'

interface ServiceListProps {
    polling?: boolean;
}

interface ProcessInfoState {
    services: fin.ProcessInfo[];
    messages: ServiceEvent[];
}

export class ServiceList extends React.Component<ServiceListProps, {}> {

    timer = 0;

    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }

    columns = [
        { Header: 'Source', headerStyle: { textAlign: "left" }, accessor: 'source', maxWidth: 250},
        { Header: 'Event', headerStyle: { textAlign: "left" }, accessor: 'message'}
    ];

    services: fin.ProcessInfo[] = [];

    componentDidMount() {
        this.timer = window.setInterval(
            () => this.pollForServices(),
            1000
        );
        // TODO subscribe to 'openfin-services-info' IAB channel
        // aggregate messages by source service
    }
    
    componentWillUnmount() {
        window.clearInterval(this.timer);
    }

    render() {
        return <ReactTable
            data={(this.state as ProcessInfoState).messages}
            columns={this.columns}
            minRows={15}
            showPagination={false}
            style={{
                height: "calc(100vh - 79px)"
            }}
            className="-striped -highlight"
       />;
    }

    private pollForServices() {
        if (this.props.polling) {
            const newservices:fin.ProcessInfo[] = [];
            fin.desktop.System.getProcessList(async (list) => {
                for (let i = 0; i < list.length; i++) {
                    const proc = list[i];
                    if (proc.name && proc.name.endsWith('-service')) {
                        newservices[newservices.length] = proc;
                    }
                }
                // TODO detect if serices list is different and update state
                this.setState({services: newservices});
            });
        }
    }
}

