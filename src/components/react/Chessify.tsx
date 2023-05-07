import { App } from "obsidian";
import * as React from "react";
import { ChessifyPluginSettings } from "src/components/obsidian/SettingsTab";
import { ChessgroundWrapper, ChessGroundSettings } from "./ChessgroundWrapper";
import { parseUserConfig } from "src/utils";

export type ChessifyConfig = ChessGroundSettings;

interface AppProps {
	source: string;
	app: App;
	pluginSettings: ChessifyPluginSettings;
}

export const Chessify = ({ source, pluginSettings }: AppProps) => {
	const config = parseUserConfig(pluginSettings, source);

	return (
		<ChessgroundWrapper
			boardColor={config.boardColor}
			config={{
				fen: config.fen,
				orientation: config.boardOrientation,
			}}
		/>
	);
};
