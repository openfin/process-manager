import { useState, useEffect } from 'react';
import { Space, Button } from 'antd';
import { CodeOutlined, MedicineBoxOutlined, InfoCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { blue } from '@ant-design/colors';
import { showDeveloperTools, closeItem, rescueWindow, toggleWindowVisibility, getCurrentUUID } from '../hooks/api';

export const ProcessActions = ({ item, infoHandler }) => {
    const [uuid, setUUID] = useState('x.x.x')

    // get our UUID ensuring it runs only once
    useEffect(() => {
        const uuid = getCurrentUUID();
        setUUID(uuid);
    }, [])

    const size = 'small';
    const buttonType = 'primary';

    const showDevTools = () => {
        showDeveloperTools(item.identity);
    }

    const showInfo = async () => {
        infoHandler(item);
    }

    const rescueWin = () => {
        rescueWindow(item.identity);
    }

    const close = () => {
        closeItem(item.identity);
    }

    const toggleWindowVis = () => {
        toggleWindowVisibility(item.identity, item.visible);
    }

    const isButtonDisabled = () => {
        return item.identity.uuid === uuid
    }

    const getButtonStyle = () => {
        let buttonColor;
        switch(item.identity.entityType) {
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
    if (item.identity.entityType === 'window') {
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
        <Button title={`show ${item.identity.entityType} info`} type="primary" style={getButtonStyle()} size={size} onClick={showInfo} 
            icon={<InfoCircleOutlined />}></Button>
        <Button title={`close ${item.identity.entityType}`} type="primary" style={getButtonStyle()} size={size} onClick={close} 
            icon={<CloseCircleOutlined />} 
            disabled={isButtonDisabled()}></Button>
        {winButtons}
    </Space>
}
