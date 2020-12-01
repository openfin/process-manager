import * as React from 'react';
import { Switch } from 'antd';
import { RVMInfo } from './rvmInfo'

interface ViewHeaderProps {
    checked: boolean;
    onChange: any;
}

export const ViewHeader = ({ checked, onChange, children }: React.PropsWithChildren<ViewHeaderProps>) => {
    return <menu>
        <li>Refresh</li>
        <li>
            <Switch checkedChildren="Auto" unCheckedChildren="Man" checked={checked} onChange={onChange} />
        </li>
        {React.Children.map(children, ch => <li>{ch}</li>)}
        <li className="rhs"><RVMInfo /></li>
    </menu>
}
