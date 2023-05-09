import { Chess } from "chess.js";
import { Editor, Notice, Plugin } from "obsidian";
import { ReactView } from "./components/ReactView";
import { PgnModal } from "./components/obsidian/PgnModal";
import {
	ChessifyPluginSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./components/obsidian/SettingsTab";
import {
	ChessifyDataAdapter,
	ChessifyFileData,
	parseUserConfig,
} from "./utils";

// these styles must be imported somewhere
import "assets/board/green.css";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import "../reset.css";
import "./main.css";

export default class ChessifyPlugin extends Plugin {
	settings: ChessifyPluginSettings;
	dataAdapter: ChessifyDataAdapter;
	storagePath = `${this.app.vault.configDir}/plugins/${this.manifest.id}/storage/`;

	async onload() {
		// Load Settings
		await this.loadSettings();

		// Register Data Adapter
		this.dataAdapter = new ChessifyDataAdapter(
			this.app.vault.adapter,
			this.storagePath
		);

		// Add settings tab
		this.addSettingTab(new SettingsTab(this.app, this));

		// Add command
		this.addCommand({
			id: "insert-chesser",
			name: "Insert PGN-Editor at cursor position",
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

						const chessifyFileData: ChessifyFileData = {
							header: {
								title: chess.header()["opening"] || null,
							},
							moves: chess
								.history({ verbose: true })
								.map((move) => ({
									...move,
									subMoves: [],
									shapes: [],
								})),
						};

						const id = await this.dataAdapter.saveFile(
							chessifyFileData
						);

						editor.replaceRange(
							`\`\`\`chessify\nchessifyId: ${id}\n\`\`\``,
							cursorPosition
						);
					} catch (e) {
						new Notice("There was an error during PGN parsing.", 0);
					}
				};

				new PgnModal(this.app, onSubmit).open();
			},
		});

		// Add chessify code block processor
		this.registerMarkdownCodeBlockProcessor(
			"chessify",
			async (source, el, ctx) => {
				const { chessifyId } = parseUserConfig(this.settings, source);

				if (!chessifyId.trim().length)
					return new Notice(
						"No chessifyId parameter found, please add one manually if the file already exists or add it via the 'Insert PGN-Editor at cursor position' command.",
						0
					);

				try {
					const data = await this.dataAdapter.loadFile(chessifyId);

					ctx.addChild(
						new ReactView(el, source, this.app, this.settings, data)
					);
				} catch (e) {
					new Notice(
						`There was an error while trying to load ${chessifyId}.json. You can check the plugin folder if the file exist and if not add one via the 'Insert PGN-Editor at cursor position' command.`,
						0
					);
				}
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
