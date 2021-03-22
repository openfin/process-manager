import * as React from 'react';
import { Slider } from 'antd';
import { RVMInfo } from './rvmInfo'

interface ViewHeaderProps {
    onChange: any;
}

function sliderFormatter(value) {
    return `${Math.floor(value/1000)}s`;
}

export const ViewHeader = ({ onChange, children }: React.PropsWithChildren<ViewHeaderProps>) => {
    return <menu>
        {React.Children.map(children, ch => <li>{ch}</li>)}
        <li style={{paddingTop:1}}>refresh</li>
        <li style={{width:70}}>
            <Slider style={{padding:1}} step={1000} min={1000} max={10000} tipFormatter={sliderFormatter} onChange={onChange} />
        </li>
        <li className="rhs"><RVMInfo /></li>
    </menu>
}
