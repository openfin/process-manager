import { useState, useEffect } from 'react';
import { getRVMInfo } from '../hooks/utils';

export const RVMInfo = () => {
    const [rvmVersion, setRVMVersion] = useState('x.x.x')

    const loadData = async () => {
        const info = await getRVMInfo()
        setRVMVersion(info.version)
    }

    useEffect(() => {
        loadData()
    })

    return <div className="rhs">RVM v{rvmVersion}</div>
}
