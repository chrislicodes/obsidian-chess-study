import { parseYaml } from "obsidian";
import { ChessifyPluginSettings } from "src/components/obsidian/SettingsTab";

type ChessifyAppConfig = ChessifyPluginSettings & {
	fen: string;
};

export const parseUserConfig = (
	settings: ChessifyPluginSettings,
	content: string
): ChessifyAppConfig => {
	const chessifyConfig: ChessifyAppConfig = {
		...settings,
		fen: "",
	};

	try {
		return {
			...chessifyConfig,
			...parseYaml(content),
		};
	} catch (e) {
		throw Error("Something went wrong during parsing. :(");
	}
};
