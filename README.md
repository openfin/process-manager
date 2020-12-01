# OpenFin Process Manager Demo

## Overview
Process Manager demonstrates an HTML5 application that has privileged access to the operating system using OpenFin. The application displays statistics about different applications running in OpenFin, including CPU and memory.  It also displays all OpenFin windows running on the desktop.  You can launch the chrome debugger for any app/window as well as rescue a window that's off screen.

### Features
* Display all applications running in OpenFin with CPU Usage and Memory consumption
* Display all windows running in OpenFin with size/position
* Debug Applications/Windows
* Terminate Applications
* Visualize open window positions on the desktop

## Launch
### OpenFin Installer
* Click this OpenFin [Process Manager Installer](https://install.openfin.co/download?fileName=ProcessManager&config=https://cdn.openfin.co/process-manager/app.json).
* Unzip and run the installer.
* Double click the icon it creates on your desktop.

### Run Locally
* Make sure you have [node](https://nodejs.org/en/) installed.
* Clone this repository.
* Open a command-line terminal and run `yarn install`.
* After all packages have been installed, run `yarn dev`.

## Disclaimers
* This is a starter example and intended to demonstrate to app providers a sample of how to approach an implementation. There are potentially other ways to approach it and alternatives could be considered. 
* This is an open source project and all are encouraged to contribute.
* Its possible that the repo is not actively maintained.

## License
MIT

The code in this repository is covered by the included license.
However, if you run this code, it may call on the OpenFin RVM or OpenFin Runtime, which are covered by OpenFin’s Developer, Community, and Enterprise licenses. You can learn more about OpenFin licensing at the links listed below or just email us at support@openfin.co with questions.

https://openfin.co/developer-agreement/ <br>
https://openfin.co/licensing/”

## Support
Please enter an issue in the repo for any questions or problems. 
<br> Alternatively, please contact us at support@openfin.co
