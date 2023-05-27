import { Chess } from 'chess.js';
import { Editor, Notice, Plugin, normalizePath } from 'obsidian';
import {
	CURRENT_STORAGE_VERSION,
	ChessStudyDataAdapter,
	ChessStudyFileData,
} from 'src/lib/storage';
import { ReactView } from './components/ReactView';
import { PgnModal } from './components/obsidian/PgnModal';
import {
	ChessStudyPluginSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from './components/obsidian/SettingsTab';

// these styles must be imported somewhere
import 'assets/board/green.css';
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { nanoid } from 'nanoid';
import { parseUserConfig } from './lib/obsidian';
import './main.css';

export default class ChessStudyPlugin extends Plugin {
	settings: ChessStudyPluginSettings;
	dataAdapter: ChessStudyDataAdapter;
	storagePath = normalizePath(
		`${this.app.vault.configDir}/plugins/${this.manifest.id}/storage/`
	);

	async onload() {
		// Load Settings
		await this.loadSettings();

		// Register Data Adapter
		this.dataAdapter = new ChessStudyDataAdapter(
			this.app.vault.adapter,
			this.storagePath
		);

		this.dataAdapter.createStorageFolderIfNotExists();

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));

		// Add command
		this.addCommand({
			id: 'insert-chess-study',
			name: 'Insert PGN-Editor at cursor position',
			editorCallback: (editor: Editor) => {
				const cursorPosition = editor.getCursor();

				const onSubmit = async (pgn: string) => {
					try {
						const chess = new Chess();

						if (pgn) {
							//Try to parse the PGN
							chess.loadPgn(pgn, {
								strict: false,
							});
						}

						const chessStudyFileData: ChessStudyFileData = {
							version: CURRENT_STORAGE_VERSION,
							header: {
								title: chess.header()['opening'] || null,
							},
							moves: chess.history({ verbose: true }).map((move) => ({
								...move,
								moveId: nanoid(),
								variants: [],
								shapes: [],
								comment: null,
							})),
						};

						this.dataAdapter.createStorageFolderIfNotExists();

						const id = await this.dataAdapter.saveFile(chessStudyFileData);

						editor.replaceRange(
							`\`\`\`chessStudy\nchessStudyId: ${id}\n\`\`\``,
							cursorPosition
						);
					} catch (e) {
						console.log(e);
						new Notice('There was an error during PGN parsing.', 0);
					}
				};

				new PgnModal(this.app, onSubmit).open();
			},
		});

		// Add chess study code block processor
		this.registerMarkdownCodeBlockProcessor(
			'chessStudy',
			async (source, el, ctx) => {
				const { chessStudyId } = parseUserConfig(this.settings, source);

				if (!chessStudyId.trim().length)
					return new Notice(
						"No chessStudyId parameter found, please add one manually if the file already exists or add it via the 'Insert PGN-Editor at cursor position' command.",
						0
					);

				try {
					const data = await this.dataAdapter.loadFile(chessStudyId);

					ctx.addChild(
						new ReactView(
							el,
							source,
							this.app,
							this.settings,
							data,
							this.dataAdapter
						)
					);
				} catch (e) {
					new Notice(
						`There was an error while trying to load ${chessStudyId}.json. You can check the plugin folder if the file exist and if not add one via the 'Insert PGN-Editor at cursor position' command.`,
						0
					);
				}
			}
		);

		console.log('Chess Study Plugin successfully loaded');
	}

	async onunload() {
		console.log('Chess Study Plugin successfully unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
