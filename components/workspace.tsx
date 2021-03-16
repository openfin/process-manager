import { useState, useEffect, useRef } from 'react';
import getAPI, { WorkspaceInfo, Monitor, WindowInfo } from '../hooks/api';

export const Workspace = ({ pollForData, initialWidth, initialHeight, labelHeight, brightness }) => {
    const defaultSize = { height: initialWidth, width: initialHeight };
    const defaultInfo:WorkspaceInfo = { virtualHeight: initialHeight, virtualWidth: initialWidth, virtualTop: 0, virtualLeft: 0, monitors: []}

    const [size, setSize] = useState(defaultSize);
    const [info, setInfo] = useState(defaultInfo)
    const [items, setItems] = useState([])
    const [resizing, setResizing] = useState(false);

    const canvasRef = useRef();
    const labelCanvasRef = useRef();

    const calcSize = () => {
        let w = document.body.clientWidth-20;
        let h = document.body.clientHeight-(80 + labelHeight);
        const vaspect = info.virtualWidth / info.virtualHeight;
        const caspect = w / h;
        if ( vaspect > caspect ) {
            h = w / vaspect;
        } else if ( vaspect < caspect ) {
            w = h * vaspect;
        }        
        setSize({height: h, width: w});
    }

    const renderCanvas = () => {
        const ctx = (canvasRef.current as HTMLCanvasElement).getContext('2d');
        const ctx2 = (labelCanvasRef.current as HTMLCanvasElement).getContext('2d');
        const xScaleFactor = size.width / info.virtualWidth;
        const yScaleFactor = size.height / info.virtualHeight;
        let xoffset = 0;
        if (info.virtualLeft < 0) {
            xoffset = Math.abs(info.virtualLeft * xScaleFactor);
        }
        let yoffset = 0;
        if (info.virtualTop < 0) {
            yoffset = Math.abs(info.virtualTop * yScaleFactor);
        }
        if (ctx && ctx2) {
            ctx.clearRect(0, 0, size.width, size.height);
            ctx2.clearRect(0, 0, size.width, labelHeight);
            const winData = items;
            winData.sort((a,b) => {
                return (a.area === b.area) ? 0 : (b.area - a.area);
            });
            for (let i=0; i<winData.length; i++) {
                const winInfo = winData[i];
                if (winInfo.showing === true) {
                    makeWindowRect(ctx, winInfo, xScaleFactor, xoffset, yScaleFactor, yoffset );
                }
            }
            for (let j=0; j<info.monitors.length; j++) {
                const monInfo = info.monitors[j];
                makeMonitorRect(ctx, monInfo, xScaleFactor, xoffset, yScaleFactor, yoffset);
                makeMonitorLabel(ctx2, monInfo, xScaleFactor, xoffset);
            }
        }
    }
    
    const makeWindowRect = (ctx:CanvasRenderingContext2D, props:WindowInfo, xscale: number, xoffset:number, yscale: number, yoffset: number) => {
        let h, w = 0;
        if (props.right && props.bottom) {
            h = props.bottom - props.top!;
            w = props.right - props.left!;
        }
        const scaledH = h * yscale;
        const scaledW = w * xscale;
        const scaledT = props.top! * yscale;
        const scaledL = props.left! * xscale;

        ctx.fillStyle = props.color;
        ctx.fillRect(scaledL+xoffset, scaledT+yoffset, scaledW, scaledH);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth   = 1;
        ctx.strokeRect(scaledL+xoffset, scaledT+yoffset, scaledW, scaledH);
        ctx.fillStyle = "#000000";
        ctx.font = '12px Arial';
        ctx.fillText(props.name!, scaledL+xoffset+5, scaledT+yoffset+15, scaledW);
    }

    const makeMonitorRect = (ctx:CanvasRenderingContext2D, props:Monitor, xscale: number, xoffset:number, yscale: number, yoffset: number) => {
        const h = props.bottom - props.top;
        const w = props.right - props.left;
        const scaledH = h * yscale;
        const scaledW = w * xscale;
        const scaledT = props.top * yscale;
        const scaledL = props.left * xscale;

        ctx.strokeStyle = "#000000";
        ctx.lineWidth   = 1;
        ctx.setLineDash([5,2,3]);
        ctx.strokeRect(scaledL+xoffset, scaledT+yoffset, scaledW, scaledH);
        ctx.setLineDash([0]);
    }

    const makeMonitorLabel = (ctx:CanvasRenderingContext2D, props:Monitor, xscale: number, xoffset:number) => {
        const h = props.bottom - props.top;
        const w = props.right - props.left;
        const scaledW = w * xscale;
        const scaledL = props.left * xscale;

        ctx.fillStyle = "#000000";
        ctx.font = '12px Arial';
        const label = `${props.right-props.left}W x ${props.bottom-props.top}H (${props.left},${props.top} to ${props.right},${props.bottom})`;
        ctx.fillText(label, scaledL+xoffset+5, (labelHeight/2)+6, scaledW);
    }

    const pollWorkspace = async () => {
        if (pollForData && !resizing) {
            const info = await getAPI().getWorkspaceInfo()
            setInfo(info)
            calcSize();
            const w = await getAPI().getWorkspaceItems(brightness);
            setItems(w);
            renderCanvas();
        }
    }

    let pollingTimer = 0;
    const startPolling = () => {
        pollWorkspace()
        pollingTimer = window.setInterval(() => pollWorkspace(), 1000);
    }

    const stopPolling = () => {
        window.clearInterval(pollingTimer);
    }

    useEffect(() => {
        let resizeTimeout = 0;
        const resizer = () => {
            setResizing(true);
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(()=> {
                calcSize();
                setResizing(false);
            }, 100);
        };
        window.addEventListener('resize', resizer);
        startPolling();
        return () => {
            window.removeEventListener('resize', resizer)
            stopPolling();
        }
    }, [pollForData])

    return <div>
        <canvas id="workspace-labels" ref={labelCanvasRef} width={size.width} height={labelHeight} />
        <canvas id="workspace" ref={canvasRef} width={size.width} height={size.height} />
    </div>;
}
