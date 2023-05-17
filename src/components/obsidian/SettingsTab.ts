import { App, PluginSettingTab, Setting } from 'obsidian';
import ChessifyPlugin from 'src/main';

export interface ChessifyPluginSettings {
	boardOrientation: 'white' | 'black';
	boardColor: 'green' | 'brown';
}

export const DEFAULT_SETTINGS: ChessifyPluginSettings = {
	boardOrientation: 'white',
	boardColor: 'green',
};

export class SettingsTab extends PluginSettingTab {
	plugin: ChessifyPlugin;

	constructor(app: App, plugin: ChessifyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Obsidian Chessify Settings' });

		new Setting(containerEl)
			.setName('Board Orientation')
			.setDesc('Sets the default orientation of the board')
			.addDropdown((dropdown) => {
				dropdown.addOption('white', 'White');
				dropdown.addOption('black', 'Black');

				dropdown
					.setValue(this.plugin.settings.boardOrientation)
					.onChange((orientation) => {
						this.plugin.settings.boardOrientation = orientation as
							| 'white'
							| 'black';
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Board Color')
			.setDesc('Sets the default color of the board')
			.addDropdown((dropdown) => {
				dropdown.addOption('green', 'Green');
				dropdown.addOption('brown', 'Brown');

				dropdown
					.setValue(this.plugin.settings.boardColor)
					.onChange((boardColor) => {
						this.plugin.settings.boardColor = boardColor as 'green' | 'brown';
						this.plugin.saveSettings();
					});
			});
	}
}
