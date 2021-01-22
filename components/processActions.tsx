import { useState, useEffect } from 'react';
import { Space, Button } from 'antd';
import { CodeOutlined, MedicineBoxOutlined, InfoCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { blue } from '@ant-design/colors';
import getAPI from '../hooks/api';

export const ProcessActions = ({ item, infoHandler }) => {
    const [uuid, setUUID] = useState('x.x.x')

    // get our UUID ensuring it runs only once
    useEffect(() => {
        getAPI().getCurrentUUID().then(uuid => setUUID(uuid));
    }, [])

    const size = 'small';
    const buttonType = 'primary';

    const showDevTools = () => {
        getAPI().showDeveloperTools(item.identity, item.entityType);
    }

    const showInfo = async () => {
        infoHandler(item);
    }

    const rescueWin = () => {
        getAPI().rescueWindow(item.identity);
    }

    const close = () => {
        getAPI().closeItem(item.identity, item.entityType);
    }

    const toggleWindowVis = () => {
        getAPI().toggleWindowVisibility(item.identity, item.visible);
    }

    const isButtonDisabled = () => {
        return item.identity.uuid === uuid
    }

    const getButtonStyle = () => {
        let buttonColor;
        switch(item.entityType) {
            case 'view':
                buttonColor = blue[3]
                break;
            case 'window':
                buttonColor = blue[4]
                break;
            case 'application':
                buttonColor = blue.primary
                break;
        }
        return { background: buttonColor, borderColor: buttonColor };
    }

    let winButtons = [];
    if (item.entityType === 'window') {
        winButtons = [
            <Button key={2} title={item.visible ? 'hide window' : 'show window'} type="primary" style={getButtonStyle()} size={size} 
                onClick={toggleWindowVis} 
                icon={item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                disabled={isButtonDisabled()}></Button>,
            <Button key={1} title="move window onscreen" type="primary" style={getButtonStyle()} size={size} onClick={rescueWin} icon={<MedicineBoxOutlined/>}></Button>,
        ]
    }

    return <Space size={size}>
        <Button title="launch dev tools" type="primary" style={getButtonStyle()} size={size} onClick={showDevTools} icon={<CodeOutlined />}></Button>
        <Button title={`show ${item.entityType} info`} type="primary" style={getButtonStyle()} size={size} onClick={showInfo} 
            icon={<InfoCircleOutlined />}></Button>
        <Button title={`close ${item.entityType}`} type="primary" style={getButtonStyle()} size={size} onClick={close} 
            icon={<CloseCircleOutlined />} 
            disabled={isButtonDisabled()}></Button>
        {winButtons}
    </Space>
}
