import { App } from "obsidian";
import * as React from "react";
import { ChessifyPluginSettings } from "src/obsidian-components/SettingsTab";
import { AppContext } from "./store/obsidian";

interface AppProps {
	source: string;
	app: App;
	settings: ChessifyPluginSettings;
}

export const Chessify = ({ source, app, settings }: AppProps) => {
	return (
		<AppContext.Provider value={{ app, settings }}>
			<div>
				<p>Hello React: This is the passed source: {source}</p>
				<p>This is a reload test again</p>
			</div>
		</AppContext.Provider>
	);
};
