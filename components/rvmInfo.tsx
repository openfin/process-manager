import { useState, useEffect } from 'react';
import { getRVMInfo } from '../hooks/api';

export const RVMInfo = ({className = 'rvminfo'}) => {
    const [rvmVersion, setRVMVersion] = useState('x.x.x')

    // load rvm version ensuring it runs only once
    useEffect(() => {
        getRVMInfo().then(i => setRVMVersion(i.version))
    }, [])

    return <div className={className}>RVM v{rvmVersion}</div>
}
