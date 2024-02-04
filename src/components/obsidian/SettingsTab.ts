import { App, PluginSettingTab, Setting } from 'obsidian';
import ChessStudyPlugin from 'src/main';

export interface ChessStudyPluginSettings {
	boardOrientation: 'white' | 'black';
	boardColor: 'green' | 'brown';
	viewComments: true | false;
}

export const DEFAULT_SETTINGS: ChessStudyPluginSettings = {
	boardOrientation: 'white',
	boardColor: 'green',
	viewComments: true,
};

export class SettingsTab extends PluginSettingTab {
	plugin: ChessStudyPlugin;

	constructor(app: App, plugin: ChessStudyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Board orientation')
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
			.setName('Board color')
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

		new Setting(containerEl)
			.setName('View Comments')
			.setDesc('Sets the default view of the comments')
			.addDropdown((dropdown) => {
				dropdown.addOption('true', 'True');
				dropdown.addOption('false', 'False');

				dropdown
					.setValue(this.plugin.settings.viewComments)
					.onChange((viewComments) => {
						this.plugin.settings.viewComments = (viewComments == true || viewComments == "true" || viewComments == "True") as true | false;
						this.plugin.saveSettings();
					});
			});

	}
}
