import { parseYaml } from 'obsidian';
import { ChessStudyPluginSettings } from 'src/components/obsidian/SettingsTab';

type ChessStudyAppConfig = ChessStudyPluginSettings & {
	chessStudyId: string;
};

export const parseUserConfig = (
	settings: ChessStudyPluginSettings,
	content: string
): ChessStudyAppConfig => {
	const chessStudyConfig: ChessStudyAppConfig = {
		...settings,
		chessStudyId: '',
	};

	try {
		return {
			...chessStudyConfig,
			...parseYaml(content),
		};
	} catch (e) {
		throw Error('Something went wrong during parsing. :(');
	}
};
