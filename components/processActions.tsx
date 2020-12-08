import { Space, Button } from 'antd';
import { CodeOutlined, MedicineBoxOutlined, InfoCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { showDeveloperTools, closeItem, rescueWindow, toggleWindowVisibility } from '../hooks/api';

export const ProcessActions = ({ item, infoHandler }) => {
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

    let winButtons = [];
    if (item.identity.entityType === 'window') {
        winButtons = [
            <Button size="small" onClick={rescueWin} key={1}><MedicineBoxOutlined /></Button>,
            <Button size="small" onClick={toggleWindowVis} key={2}>{
                item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
            }</Button>,
        ]
    }

    return <Space size="small">
        <Button size="small" onClick={showDevTools}><CodeOutlined /></Button>
        <Button size="small" onClick={showInfo}><InfoCircleOutlined /></Button>
        <Button size="small" onClick={close}><CloseCircleOutlined /></Button>
        {winButtons}
    </Space>
}
