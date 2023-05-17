import { JSONContent } from '@tiptap/react';
import { Chess, Move, QUEEN, SQUARES, Square } from 'chess.js';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import { nanoid } from 'nanoid';
import { DataAdapter, parseYaml } from 'obsidian';
import { ChessifyPluginSettings } from 'src/components/obsidian/SettingsTab';

//Chess Logic
type ChessifyAppConfig = ChessifyPluginSettings & {
	chessifyId: string;
};

export const parseUserConfig = (
	settings: ChessifyPluginSettings,
	content: string
): ChessifyAppConfig => {
	const chessifyConfig: ChessifyAppConfig = {
		...settings,
		chessifyId: '',
	};

	try {
		return {
			...chessifyConfig,
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

interface ChessifyMove extends Move {
	variants: Move[][];
	shapes: DrawShape[];
	comment: JSONContent | null;
}
export interface ChessifyFileData {
	header: { title: string | null };
	moves: ChessifyMove[];
}

export class ChessifyDataAdapter {
	adapter: DataAdapter;
	storagePath: string;

	constructor(adapter: DataAdapter, storagePath: string) {
		this.adapter = adapter;
		this.storagePath = storagePath;
	}

	async saveFile(data: ChessifyFileData, id?: string) {
		const chessifyId = id || nanoid();
		await this.adapter.write(
			`${this.storagePath}/${chessifyId}.json`,
			JSON.stringify(data, null, 2),
			{}
		);

		return chessifyId;
	}

	async loadFile(id: string): Promise<ChessifyFileData> {
		const data = await this.adapter.read(`${this.storagePath}/${id}.json`);
		return JSON.parse(data);
	}
}
