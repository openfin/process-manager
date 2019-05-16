// Apps and Services
interface AppProcessInfo {
    process: fin.ProcessInfo;
    info: AppInfo;
    parentUUID: string;
}

interface AppInfo {
    runtime: AppVersion;
    manifestUrl: string;
    manifest: Manifest;
}

interface AppVersion {
    version: string;
}

interface Manifest {
    startup_app: StartUpApp;
}

interface StartUpApp {
    url: string;
}
