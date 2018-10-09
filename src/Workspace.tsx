import * as React from 'react';

interface WorkspaceProps {
    polling?: boolean;
    height: number;
    width: number;
}

interface WorkspaceState {
    height: number;
    width: number;
    virtualTop: number;
    virtualHeight: number;
    virtualLeft: number;
    virtualWidth: number;
    data: windowInfo[];
}

interface windowInfo extends fin.WindowInfo {
    color: string;
    area: number;
}

export class Workspace extends React.Component<WorkspaceProps, {}> {

    timer = 0;
    brightness = 150;
    colorCache:{[key:string]:string};

    constructor(props:WorkspaceProps) {
        super(props);
        this.state = {
            height: props.height,
            width: props.width,
            data: []
        };
        this.colorCache = {};
    }

    componentDidMount() {
        this.setSize();
        window.addEventListener('resize', () => {
            console.log('resizing');
            this.setSize();
        });
        this.timer = window.setInterval(
            () => this.pollForWorkspaces(),
            1000
        );
    }

    setSize() {
        const w = document.body.clientWidth;
        const h = document.body.clientHeight;
        this.setState({height: h-80, width: w-20});
    }

    componentWillUnmount() {
        window.clearInterval(this.timer);
    }

    updateCanvas() {
        const canv = this.refs.canvas as HTMLCanvasElement;
        const ctx = canv.getContext('2d');
        const state = (this.state as WorkspaceState);
        const xScaleFactor = state.width / state.virtualWidth;
        const yScaleFactor = state.height / state.virtualHeight;
        let xoffset = 0;
        if (state.virtualLeft < 0) {
            xoffset = Math.abs(state.virtualLeft * xScaleFactor);
        }
        let yoffset = 0;
        if (state.virtualTop <0) {
            yoffset = Math.abs(state.virtualTop * yScaleFactor);
        }
        if (ctx) {
            ctx.clearRect(0, 0, state.width, state.height);
            const winData = state.data;
            winData.sort((a,b) => {
                return (a.area === b.area) ? 0 : (b.area - a.area);
            });
            for (let i=0; i<winData.length; i++) {
                const winInfo = winData[i];
                this.makeRect(ctx, winInfo, xScaleFactor, xoffset, yScaleFactor, yoffset );
            }    
        }
    }
    
    makeRect(ctx:CanvasRenderingContext2D, props:windowInfo, xscale: number, xoffset:number, yscale: number, yoffset: number) {
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

    // 30 random hues with step of 12 degrees
    getRandomFillColor(uuid: string, name: string) {
        const key = uuid + '__' + name;
        const color = this.colorCache[key];
        if (color) {
            return color;
        } else {
            const color = '#' + this.randomColorChannel() + this.randomColorChannel() + this.randomColorChannel();
            this.colorCache[key] = color;
            return color;
        }
    }

    randomColorChannel() {
        var r = 255-this.brightness;
        var n = 0|((Math.random() * r) + this.brightness);
        var s = n.toString(16);
        return (s.length==1) ? '0'+s : s;
    }

    render() {
        return <canvas ref="canvas" width={(this.state as WorkspaceState).width} height={(this.state as WorkspaceState).height} />;
    }

    calcWindowArea(win:windowInfo) {
        return (win.right! - win.left!)*(win.bottom! - win.top!);
    }

    private async pollForWorkspaces() {
        if (this.props.polling) {
            const monInfo = await fin.System.getMonitorInfo();
            const winList:fin.WindowInfo[] = [];
            fin.desktop.System.getAllWindows(async (list) => {
                const allWins = list.map(w => [w.mainWindow!].concat(w.childWindows!).map(cw => 
                    Object.assign(cw, {
                        uuid: w.uuid!,
                        parentName: '',
                        parentUUID: '',
                        color: this.getRandomFillColor(w.uuid!, cw.name!),
                        area: 0
                    }))
                ).reduce( (p,c) => p.concat(c), []);
                for (let w of allWins) {
                    const fInfo:fin.EntityInfo = await new Promise<fin.EntityInfo>(r => fin.desktop.Frame.wrap(w.uuid!, w.name!).getInfo(r));
                    w.parentName = fInfo.parent.name;
                    w.parentUUID = fInfo.parent.uuid;
                    w.area = this.calcWindowArea(w);
                    winList.push(w);
                }
                this.setState({
                    data: winList, 
                    virtualHeight: monInfo.virtualScreen.bottom - monInfo.virtualScreen.top, 
                    virtualWidth: monInfo.virtualScreen.right - monInfo.virtualScreen.left
                });
            });
            this.updateCanvas();
        }
    }
}