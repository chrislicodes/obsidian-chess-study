import { App, MarkdownRenderChild, Plugin } from "obsidian";
import {
	ChessifyPluginSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./obsidian-components/SettingsTab";
import * as ReactDOM from "react-dom/client";
import * as React from "react";
import { Chessify } from "./react-components/Chessify";

export default class ChessifyPlugin extends Plugin {
	settings: ChessifyPluginSettings;

	async onload() {
		// Load the Settings
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor(
			"chessify",
			(source, el, ctx) => {
				ctx.addChild(
					new ReactView(el, source, this.app, this.settings)
				);
			}
		);

		console.log("Chessify successfully loaded");
	}

	async onunload() {
		console.log("Chessify successfully unloaded");
	}

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

class ReactView extends MarkdownRenderChild {
	root: ReactDOM.Root;
	source: string;
	app: App;
	settings: ChessifyPluginSettings;

	constructor(
		containerEL: HTMLElement,
		source: string,
		app: App,
		settings: ChessifyPluginSettings
	) {
		super(containerEL);
		this.source = source;
		this.app = app;
		this.settings = settings;
	}

	onload() {
		this.root = ReactDOM.createRoot(this.containerEl);
		this.root.render(
			<React.StrictMode>
				<Chessify
					source={this.source}
					app={this.app}
					settings={this.settings}
				/>
			</React.StrictMode>
		);
	}

	onunload() {
		this.root.unmount();
	}
}
