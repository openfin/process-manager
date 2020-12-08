import { Space, Button } from 'antd';
import { CodeOutlined, MedicineBoxOutlined, InfoCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { showDeveloperTools, closeItem, rescueWindow, toggleWindowVisibility } from '../hooks/api';

export const ProcessActions = ({ item, infoHandler }) => {

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

    let winButtons = [];
    if (item.identity.entityType === 'window') {
        winButtons = [
            <Button type={buttonType} size={size} onClick={rescueWin} key={1} icon={<MedicineBoxOutlined/>}></Button>,
            <Button type={buttonType} size={size} onClick={toggleWindowVis} key={2} icon={item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}></Button>,
        ]
    }

    return <Space size={size}>
        <Button type={buttonType} size={size} onClick={showDevTools} icon={<CodeOutlined />}></Button>
        <Button type={buttonType} size={size} onClick={showInfo} icon={<InfoCircleOutlined />}></Button>
        <Button type={buttonType} size={size} onClick={close} icon={<CloseCircleOutlined />}></Button>
        {winButtons}
    </Space>
}
