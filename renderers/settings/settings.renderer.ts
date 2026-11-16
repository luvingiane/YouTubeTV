import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import { join } from 'path';
import main from '../../main';
import { DataModel } from '../../models/data.interface';
import { Dial } from '../../servers/DIAL';

export class Settings {

	private window: BrowserWindow;

	constructor() {
		app.whenReady().then(() => {

			this.window = new BrowserWindow({
				resizable: false,
				fullscreen: false,
				titleBarStyle: 'hidden',
				...(process.platform !== 'darwin' ? { titleBarOverlay: true }: {}),
				width: 730,
				height: 540,
				title: 'Settings',
				backgroundColor: '#181818',
				frame: true,
				webPreferences: {
					contextIsolation: false,
					nodeIntegration: true,
					sandbox: false,
					// Permite navegar por los ajustes con el mando.
					preload: join(__dirname, '../main/gamepad.js')
				}
			})

			ipcMain.on('update', (_, params:{ width: number, height: number, reload: boolean }) => {
				const { renderer } = main;
				renderer.setMaxRes(params);
			})

			globalShortcut.register('ctrl+shift+d', () => { this.window.webContents.toggleDevTools() });

			this.window.loadFile(join(__dirname, './index.html'));

			ipcMain.on('close', () => {
				this.destroy();
			})

			ipcMain.handle('settingsRequest', (event, args) => {
				return JSON.stringify(main.persistence.data.toJSON());
			})

			ipcMain.handle('languageRequest', (event, args) => {
				return JSON.stringify({sections: main.i18n.renderer.settings, utils: main.i18n.utils});
			})

			ipcMain.handle('updateSettings', (event, data) => {

				const settings: DataModel = JSON.parse(data);

				// Establece la resolución únicamente si es diferente.
				if (main.persistence.data.resolution != settings.resolution)
					main.renderer.setMaxRes(settings.resolution)

				// Almacena la configuración.
				// TODO: Aquí hay que usar un validador y filtrado de datos -> JOI para la siguiente versión.
				main.persistence.data.resolution = settings.resolution;
				main.persistence.data.keepSize.enabled = settings.keepSize.enabled;
				main.persistence.data.DIAL.enabled = settings.DIAL.enabled;
				main.persistence.data.DIAL.name = settings.DIAL.name;
				main.persistence.data.background = settings.background;
				main.persistence.data.userAgent.customUA = settings.userAgent.customUA;
				main.persistence.data.startFullscreen = !!settings.startFullscreen;

				// Anuncios y SponsorBlock: se aplican en caliente y se recarga la página para que el preload los relea.
				const adBlockChanged = main.persistence.data.adBlock !== !!settings.adBlock;
				const sponsorBlockChanged = main.persistence.data.sponsorBlock !== !!settings.sponsorBlock;
				main.persistence.data.adBlock = !!settings.adBlock;
				main.persistence.data.sponsorBlock = !!settings.sponsorBlock;
				if(adBlockChanged) main.renderer.setAdBlock(main.renderer.features.adBlock);
				if(adBlockChanged || sponsorBlockChanged) main.renderer.reloadPage();

				// Si DIAL está activado.
				if(settings.DIAL.enabled) {
					// Si no existe instancia DIAL, crea una con el nombre.
					if(!main.dial) main.dial = new Dial(settings.DIAL.name);
					// En caso contrario
					else {
						// Reemplaza el nombre.
						main.dial.friendlyName = settings.DIAL.name;
						// Si no se está escuchando, escucha.
						if(!main.dial.listening) main.dial.start();
					}
				// En caso contrario, si existe una instancia DIAL, detiene el servidor.
				} else if(main.dial) main.dial.stop();
				
			})
		})
	}

	public destroy() {
		this.window.destroy();
	}
}