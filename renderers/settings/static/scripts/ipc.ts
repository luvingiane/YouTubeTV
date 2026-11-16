import { DataModel } from "../../../../models/data.interface";

class IPC {

    private readonly ipc: Electron.IpcRenderer = window.require('electron').ipcRenderer;
    private _settings: DataModel;

    constructor() { }

    public loadSettings(): Promise<DataModel> {
        return this.ipc.invoke('settingsRequest')
               .then(d => {
                d = JSON.parse(d);
                this._settings = d;
                return d;
            });
    }

    public getLanguageFiles(): Promise<any> {
        return this.ipc.invoke('languageRequest').then(d => JSON.parse(d))
    }

    /** Cierra la ventana de ajustes. */
    public closeSettings(): void {
        this.ipc.send('close');
    }

    /** Cierra la aplicación. */
    public quitApp(): void {
        // ytvQuit (gamepad.js) aspetta che i tasti del pad siano rilasciati prima di chiudere.
        const quit = (window as any).ytvQuit;
        if(typeof quit === 'function') quit();
        else this.ipc.send('ytv:quit');
    }

    public get settings(): DataModel {
        return this._settings;
    }

    public set settings(data: DataModel) {
        this._settings = data;
        this.ipc.invoke('updateSettings', JSON.stringify(this._settings))
        .then(() => {
        })
        .catch(() => {
            console.log('error')
        })
        
    }

}

export const ipc: IPC = new IPC();