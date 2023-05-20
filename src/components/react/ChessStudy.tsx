import { JSONContent } from '@tiptap/react';
import { Chess, Move } from 'chess.js';
import { Api } from 'chessground/api';
import { DrawShape } from 'chessground/draw';
import { App, Notice } from 'obsidian';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ChessStudyPluginSettings } from 'src/components/obsidian/SettingsTab';

import { parseUserConfig } from 'src/lib/obsidian';
import { ChessStudyDataAdapter, ChessStudyFileData } from 'src/lib/storage';
import { ChessGroundSettings, ChessgroundWrapper } from './ChessgroundWrapper';
import { CommentSection } from './CommentSection';
import { PgnViewer } from './PgnViewer';

export type ChessStudyConfig = ChessGroundSettings;

interface AppProps {
	source: string;
	app: App;
	pluginSettings: ChessStudyPluginSettings;
	chessStudyData: ChessStudyFileData;
	dataAdapter: ChessStudyDataAdapter;
}

export const ChessStudy = ({
	source,
	pluginSettings,
	chessStudyData,
	dataAdapter,
}: AppProps) => {
	// Parse Obsidian / Code Block Settings
	const { boardColor, boardOrientation, chessStudyId } = parseUserConfig(
		pluginSettings,
		source
	);

	const [chessStudyDataModified] = useState(chessStudyData);

	// Setup Chessboard and Chess.js APIs
	const [chessView, setChessView] = useState<Api | null>(null);
	const chessLogic = useMemo(() => {
		const chess = new Chess();

		chessStudyData.moves.forEach((move) => {
			chess.move({
				from: move.from,
				to: move.to,
				promotion: move.promotion,
			});
		});
		return chess;
	}, [chessStudyData.moves]);

	// Track Application State
	const [history, setHistory] = useState<Move[]>([]);
	const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
	const [currentMove, setCurrentMove] = useState<number>(0);
	const [shapes, setShapes] = useState<DrawShape[][]>(
		chessStudyData.moves.map((data) => data.shapes)
	);
	const [comments, setComments] = useState<(JSONContent | null)[]>(
		chessStudyData.moves.map((data) => data.comment)
	);

	//PgnViewer Functions
	const onBackButtonClick = useCallback(() => {
		if (currentMove >= 0) {
			setCurrentMove((currentMove) => {
				const move = history[currentMove];
				const tempChess = new Chess(move.before);
				chessView?.set({
					fen: move.before,
					check: tempChess.isCheck(),
				});
				setIsViewOnly(true);
				return currentMove - 1;
			});
		}
	}, [chessView, currentMove, history]);

	const onForwardButtonClick = useCallback(() => {
		if (currentMove < history.length - 1) {
			setCurrentMove((currentMove) => {
				const move = history[currentMove + 1];
				const tempChess = new Chess(move.after);
				chessView?.set({
					fen: move.after,
					check: tempChess.isCheck(),
				});
				if (currentMove + 1 === history.length - 1) setIsViewOnly(false);
				return currentMove + 1;
			});
		}
	}, [currentMove, chessView, history]);

	const onMoveItemClick = useCallback(
		(moveIndex: number) => {
			if (moveIndex !== currentMove) {
				setCurrentMove(() => {
					const move = history[moveIndex];
					const tempChess = new Chess(move.after);
					chessView?.set({
						fen: move.after,
						check: tempChess.isCheck(),
					});
					if (moveIndex !== history.length - 1) {
						setIsViewOnly(true);
					} else {
						setIsViewOnly(false);
					}

					return moveIndex;
				});
			}
		},
		[chessView, currentMove, history]
	);

	const onSaveButtonClick = useCallback(async () => {
		const chessStudyData: ChessStudyFileData = {
			header: chessStudyDataModified.header,
			moves: chessLogic.history({ verbose: true }).map((move, index) => ({
				...move,
				variants: [],
				shapes: shapes[index],
				comment: comments[index],
			})),
		};

		await dataAdapter.saveFile(chessStudyData, chessStudyId);

		new Notice('Save successfull!');
	}, [
		chessLogic,
		chessStudyDataModified.header,
		chessStudyId,
		comments,
		dataAdapter,
		shapes,
	]);

	return (
		<div className="chess-study border">
			<div className="chessground-pgn-container">
				<div className="chessground-container">
					<ChessgroundWrapper
						api={chessView}
						setApi={setChessView}
						chessStudyId={chessStudyId}
						config={{
							orientation: boardOrientation,
						}}
						boardColor={boardColor}
						chess={chessLogic}
						setHistory={setHistory}
						setMoveNumber={setCurrentMove}
						isViewOnly={isViewOnly}
						setShapes={setShapes}
						currentMoveNumber={currentMove}
						currentMoveShapes={shapes[currentMove]}
					/>
				</div>
				<div className="pgn-container">
					<PgnViewer
						history={history}
						currentMove={currentMove}
						onBackButtonClick={onBackButtonClick}
						onForwardButtonClick={onForwardButtonClick}
						onMoveItemClick={onMoveItemClick}
						onSaveButtonClick={onSaveButtonClick}
					/>
				</div>
			</div>
			<div className="CommentSection border-top">
				<CommentSection
					currentMove={currentMove}
					currentComment={comments[currentMove]}
					setComments={setComments}
				/>
			</div>
		</div>
	);
};
