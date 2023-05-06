import { PluginSettingTab, App, Setting } from "obsidian";
import ChessifyPlugin from "src/main";

export interface ChessifyPluginSettings {
	defaultOrientation: "white" | "black";
}

export const DEFAULT_SETTINGS: ChessifyPluginSettings = {
	defaultOrientation: "white",
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

		containerEl.createEl("h2", { text: "Obsidian Chessify Settings" });

		new Setting(containerEl)
			.setName("Orientation")
			.setDesc("Sets the default orientation of the board")
			.addDropdown((dropdown) => {
				dropdown.addOption("white", "White");
				dropdown.addOption("black", "Black");

				dropdown
					.setValue(this.plugin.settings.defaultOrientation)
					.onChange((orientation) => {
						this.plugin.settings.defaultOrientation =
							orientation as "white" | "black";
						this.plugin.saveSettings();
					});
			});
	}
}
