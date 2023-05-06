import { Plugin } from "obsidian";
import {
	ChessifyPluginSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./obsidian-components/SettingsTab";

export default class ChessifyPlugin extends Plugin {
	settings: ChessifyPluginSettings;

	async onload() {
		// Load the Settings
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	async onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
