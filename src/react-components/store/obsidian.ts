import * as React from "react";
import { App } from "obsidian";
import { ChessifyPluginSettings } from "src/obsidian-components/SettingsTab";

interface AppContextProps {
	app: App;
	settings: ChessifyPluginSettings;
}

export const AppContext = React.createContext<AppContextProps | null>(null);

export const useApp = (): AppContextProps | null => {
	if (AppContext) {
		return React.useContext(AppContext);
	}

	return null;
};
