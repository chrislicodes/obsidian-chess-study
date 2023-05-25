import { JSONContent } from '@tiptap/react';
import { Move } from 'chess.js';
import { DrawShape } from 'chessground/draw';
import { nanoid } from 'nanoid';
import { DataAdapter, normalizePath } from 'obsidian';

export const CURRENT_STORAGE_VERSION = '0.0.1';

export interface VariantMove extends Move {
	moveId: string;
	shapes: DrawShape[];
	comment: JSONContent | null;
}

export interface Variant {
	variantId: string;
	parentMoveId: string;
	moves: VariantMove[];
}

export interface ChessStudyMove extends Move {
	moveId: string;
	variants: Variant[];
	shapes: DrawShape[];
	comment: JSONContent | null;
}

export interface ChessStudyFileData {
	version: string;
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
