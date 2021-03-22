import { useState, useEffect, useRef, MutableRefObject } from 'react'
import getAPI, { Monitor, WindowInfo } from '../hooks/api'
import { usePolling, useWindowSize } from '../hooks/utils'
import { Button, Space } from 'antd'

function useWorkspaceInfo() {
    const [workspaceInfo, setWorkSpaceInfo] = useState({ virtualHeight: 0, virtualWidth: 0, virtualTop: 0, virtualLeft: 0, monitors: [] });
    usePolling(async () => {
        const info = await getAPI().getWorkspaceInfo()
        setWorkSpaceInfo(info);
    }, 5179, 'monitors')
    return workspaceInfo;
}

function useWorkspaceItems(pollRate, brightness) {
    const [workspaceItems, setWorkSpaceItems] = useState([]);
    usePolling(async () => {
        const info = await getAPI().getWorkspaceItems(brightness)
        setWorkSpaceItems(info);
    }, pollRate, 'windows')
    return workspaceItems;
}

export const Workspace = ({ pollRate, initialWidth, initialHeight, headerHeight, brightness }) => {

    const windowSize = useWindowSize();
    const [size, setSize] = useState({ height: initialHeight, width: initialWidth });
    const [canvasFont, setCanvasFont] = useState('18px Arial');
    const info = useWorkspaceInfo();
    const items = useWorkspaceItems(pollRate, brightness);

    const canvasRef:MutableRefObject<HTMLCanvasElement> = useRef();

    const labelHeight = 48;

    const calcSize = () => {
        let w = document.body.clientWidth-20;
        let h = document.body.clientHeight - (1*headerHeight + labelHeight);
        const vaspect = info.virtualWidth / info.virtualHeight;
        const caspect = w / h;
        if ( vaspect > caspect ) {
            h = w / vaspect;
        } else if ( vaspect < caspect ) {
            w = h * vaspect;
        }
        setSize({ height: h, width: w });

        // device pixel ratio is used to prevent blurry text rendering
        const xScaleFactor = size.width / info.virtualWidth;
        const yScaleFactor = size.height / info.virtualHeight;
        const ratio = window.devicePixelRatio;
        canvasRef.current.width = w * ratio;
        canvasRef.current.height = h * ratio;
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;
        canvasRef.current.getContext('2d').scale(xScaleFactor*ratio, yScaleFactor*ratio);
    }

    const renderCanvas = () => {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, info.virtualWidth, info.virtualHeight);
            const winData = items;
            winData.sort((a,b) => {
                return (a.area === b.area) ? 0 : (b.area - a.area);
            });
            drawWindows(ctx, winData);
            drawMonitors(ctx);
        }
    }

    const drawWindows = (ctx:CanvasRenderingContext2D, wins) => {
        for (let i=0; i<wins.length; i++) {
            const winInfo = wins[i];
            if (winInfo.showing === true) {
                drawWindowRect(ctx, winInfo);
            }
        }
    }

    const drawMonitors = (ctx:CanvasRenderingContext2D) => {
        for (let j=0; j<info.monitors.length; j++) {
            const monInfo = info.monitors[j];
            drawMonitorRect(ctx, monInfo);
        }
    }
    
    const drawWindowRect = (ctx:CanvasRenderingContext2D, props:WindowInfo) => {
        const h = props.bottom - props.top;
        const w = props.right - props.left;
        const t = props.top;
        const l = props.left;

        ctx.fillStyle = props.color;
        ctx.fillRect(l, t, w, h);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth   = 1;
        ctx.strokeRect(l, t, w, h);
        ctx.fillStyle = "#000000";
        ctx.font = canvasFont;
        ctx.fillText(props.name, l+10, t+36, w);
    }

    const drawMonitorRect = (ctx:CanvasRenderingContext2D, props:Monitor) => {
        const h = props.bottom - props.top;
        const w = props.right - props.left;

        // monitor outline
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth   = 1;
        ctx.strokeRect(props.left, props.top, w, h);

        // monitor label
        ctx.fillStyle = "#000000";
        ctx.font = canvasFont;
        const label = `${w}W x ${h}H (${props.left},${props.top} to ${props.right},${props.bottom})`;
        ctx.textAlign = "end"; 
        ctx.fillText(label, props.right-10, props.top + 28, w);
        ctx.textAlign = "start";
    }

    useEffect(renderCanvas, [info, items, size])
    useEffect(calcSize, [windowSize, items, info])

    return <div>
        <div style={{ height: labelHeight}}>
            <Space>
            {info.monitors.map(function(mon) {
                const label = `${mon.right-mon.left}W x ${mon.bottom-mon.top}H (${mon.left},${mon.top} to ${mon.right},${mon.bottom})`;
                return <Button title={label} type="primary">{mon.name}</Button>;
            })}
            </Space>
        </div>
        <div style={{ height: size.height + 1}}>
            <canvas id="workspace" ref={canvasRef} />
        </div>
    </div>;
}
