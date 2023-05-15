import { App, MarkdownRenderChild } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ChessifyDataAdapter, ChessifyFileData } from "src/utils";
import { Chessify } from "../components/react/Chessify";
import { ChessifyPluginSettings } from "./obsidian/SettingsTab";

export class ReactView extends MarkdownRenderChild {
	root: ReactDOM.Root;
	source: string;
	app: App;
	settings: ChessifyPluginSettings;
	data: ChessifyFileData;
	dataAdapter: ChessifyDataAdapter;

	constructor(
		containerEL: HTMLElement,
		source: string,
		app: App,
		settings: ChessifyPluginSettings,
		data: ChessifyFileData,
		dataAdapter: ChessifyDataAdapter
	) {
		super(containerEL);
		this.source = source;
		this.app = app;
		this.settings = settings;
		this.data = data;
		this.dataAdapter = dataAdapter;
	}

	onload() {
		this.root = ReactDOM.createRoot(this.containerEl);
		this.root.render(
			<React.StrictMode>
				<Chessify
					source={this.source}
					app={this.app}
					pluginSettings={this.settings}
					chessifyData={this.data}
					dataAdapter={this.dataAdapter}
				/>
			</React.StrictMode>
		);
	}

	onunload() {
		this.root.unmount();
	}
}
