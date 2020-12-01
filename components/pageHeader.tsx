import Head from 'next/head'

export const PageHeader = ({ title }) => {
    return <Head>
        <title>{title}</title>
        <link rel="icon" href="/proc-mgr-icon.ico" />
    </Head>
}
