import { useState, useEffect } from 'react';
import getAPI from '../hooks/api';

export const RVMInfo = ({className = 'rvminfo'}) => {
    const [rvmVersion, setRVMVersion] = useState('x.x.x')

    // load rvm version ensuring it runs only once
    useEffect(() => {
        getAPI().getRVMVersion().then(v => setRVMVersion(v))
    }, [])

    return <div className={className}>RVM v{rvmVersion}</div>
}
