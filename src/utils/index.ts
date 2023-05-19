import { JSONContent } from '@tiptap/react';
import { Chess, Move, QUEEN, SQUARES, Square } from 'chess.js';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import { nanoid } from 'nanoid';
import { DataAdapter, normalizePath, parseYaml } from 'obsidian';
import { ChessStudyPluginSettings } from 'src/components/obsidian/SettingsTab';

//Chess Logic
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

export function toColor(chess: Chess) {
	return chess.turn() === 'w' ? 'white' : 'black';
}

export function toDests(chess: Chess): Map<Square, Square[]> {
	const dests = new Map();
	SQUARES.forEach((s) => {
		const ms = chess.moves({ square: s, verbose: true });
		if (ms.length)
			dests.set(
				s,
				ms.map((m) => m.to)
			);
	});
	return dests;
}

export function playOtherSide(cg: Api, chess: Chess) {
	return (orig: string, dest: string) => {
		const move = chess.move({ from: orig, to: dest, promotion: QUEEN });

		const commonTurnProperties: Partial<Config> = {
			turnColor: toColor(chess),
			movable: {
				color: toColor(chess),
				dests: toDests(chess),
			},
			check: chess.isCheck(),
		};

		if (move.flags === 'e' || move.promotion) {
			//Handle En Passant && Promote to Queen by default
			cg.set({
				fen: chess.fen(),
				...commonTurnProperties,
			});
		} else {
			cg.set(commonTurnProperties);
		}

		return chess.history({ verbose: true });
	};
}

//Storage Logic

interface ChessStudyMove extends Move {
	variants: Move[][];
	shapes: DrawShape[];
	comment: JSONContent | null;
}
export interface ChessStudyFileData {
	header: { title: string | null };
	moves: ChessStudyMove[];
}

export class ChessStudyDataAdapter {
	adapter: DataAdapter;
	storagePath: string;

	constructor(adapter: DataAdapter, storagePath: string) {
		this.adapter = adapter;
		this.storagePath = storagePath;
	}

	async saveFile(data: ChessStudyFileData, id?: string) {
		const chessStudyId = id || nanoid();
		await this.adapter.write(
			normalizePath(`${this.storagePath}/${chessStudyId}.json`),
			JSON.stringify(data, null, 2),
			{}
		);

		return chessStudyId;
	}

	async loadFile(id: string): Promise<ChessStudyFileData> {
		const data = await this.adapter.read(
			normalizePath(`${this.storagePath}/${id}.json`)
		);
		return JSON.parse(data);
	}

	async createStorageFolderIfNotExists() {
		const folderExists = await this.adapter.exists(this.storagePath);

		if (!folderExists) {
			this.adapter.mkdir(this.storagePath);
		}
	}
}
