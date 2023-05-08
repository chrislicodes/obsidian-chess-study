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
	const { fen, boardColor, boardOrientation } = parseUserConfig(
		pluginSettings,
		source
	);

	return (
		<ChessgroundWrapper
			boardColor={boardColor}
			config={{
				fen: fen,
				orientation: boardOrientation,
			}}
		/>
	);
};
