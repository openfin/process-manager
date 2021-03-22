import { useEffect, useRef, useState } from 'react';

export const usePolling = (callback, interval = 1000, name = '') => {
    const savedCallback = useRef<() => any>();
    const timeoutId = useRef<number>();

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        const tick = async () => {
            // console.log(`${name} polling`)
            try {
                await savedCallback.current();
            } catch (e) {
                console.error(e);
            }
        }
        let timeout = setInterval(tick, interval);
        timeoutId.current = timeout as unknown as number;
        tick();
        return () => {
            // console.log(`${name} not polling`)
            clearInterval(timeoutId.current);
        }
    }, [interval]);
}

export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
      width: undefined,
      height: undefined,
    });
  
    useEffect(() => {
      function handleResize() {
        setWindowSize({
          width: document.body.clientWidth,
          height: document.body.clientHeight,
        });
      }

      // call handler right away and attach lsitener
      handleResize();
      window.addEventListener("resize", handleResize);    
      
      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
    return windowSize;
}

// format a number as bytes (example: 1024 => 1KB)
const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
export const formatBytes = (size:number, places: number) => {
    if (size > GB) {
        return (size / GB).toFixed(places) + 'GB';
    } else if (size > MB) {
        return (size / MB).toFixed(places) + 'MB';
    } else if (size > KB) {
        return (size / KB).toFixed(places) + 'KB';
    } else if (size === 0) {
        return '0';
    } else {
        return size.toFixed(1) + 'B';
    }
};

export const url2AppName = (name: string) => {
    return name.replace(/https?:\/\//, '').replace(/\//g, '-').replace('.', '-');
}

export const url2AppUUID = (name: string) => {
    return name.replace(/https?:\/\//, '').replace(/\//g, '-').replace('.', '-');
}

const colorCache:{[key:string]:string} = {};
export const getRandomFillColor = (uuid: string, name: string, brightness: number) => {
    const key = uuid + '__' + name;
    const color = colorCache[key];
    if (color) {
        return color;
    } else {
        const color = '#' + randomColorChannel(brightness) + randomColorChannel(brightness) + randomColorChannel(brightness);
        colorCache[key] = color;
        return color;
    }
}

export const randomColorChannel = (brightness:number) => {
    const r = 255-brightness;
    const n = 0|((Math.random() * r) + brightness);
    const s = n.toString(16);
    return (s.length === 1) ? '0'+s : s;
}