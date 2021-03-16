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
            <Button title={item.visible ? 'hide window' : 'show window'} onClick={toggleWindowVis} icon={item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />} disabled={isButtonDisabled()} size={size} key={1}></Button>,
            <Button title="move window onscreen" onClick={rescueWin} icon={<MedicineBoxOutlined/>} size={size} key={2}></Button>,
        ]
    }

    return <Space size={size}>
        <Button title="dev tools" type="primary" onClick={showDevTools} icon={<CodeOutlined />} size={size}></Button>
        <Button title={`show ${item.entityType} info`} type="primary" onClick={showInfo} icon={<InfoCircleOutlined />} size={size}></Button>
        <Button title={`close ${item.entityType}`} type="primary" onClick={close} icon={<CloseCircleOutlined />} disabled={isButtonDisabled()} size={size}></Button>
        {winButtons}
    </Space>
}
