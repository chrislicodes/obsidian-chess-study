import { JSONContent } from '@tiptap/react';
import { Chess, Move } from 'chess.js';
import { Api } from 'chessground/api';
import { DrawShape } from 'chessground/draw';
import { App, Notice } from 'obsidian';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ChessifyPluginSettings } from 'src/components/obsidian/SettingsTab';
import {
	ChessifyDataAdapter,
	ChessifyFileData,
	parseUserConfig,
} from 'src/utils';
import { ChessGroundSettings, ChessgroundWrapper } from './ChessgroundWrapper';
import { CommentSection } from './CommentSection';
import { PgnViewer } from './PgnViewer';

export type ChessifyConfig = ChessGroundSettings;

interface AppProps {
	source: string;
	app: App;
	pluginSettings: ChessifyPluginSettings;
	chessifyData: ChessifyFileData;
	dataAdapter: ChessifyDataAdapter;
}

export const Chessify = ({
	source,
	pluginSettings,
	chessifyData,
	dataAdapter,
}: AppProps) => {
	// Parse Obsidian / Code Block Settings
	const { boardColor, boardOrientation, chessifyId } = parseUserConfig(
		pluginSettings,
		source
	);

	const [chessifyDataModified] = useState(chessifyData);

	// Setup Chessboard and Chess.js APIs
	const [chessView, setChessView] = useState<Api | null>(null);
	const chessLogic = useMemo(() => {
		const chess = new Chess();

		chessifyData.moves.forEach((move) => {
			chess.move({
				from: move.from,
				to: move.to,
				promotion: move.promotion,
			});
		});
		return chess;
	}, [chessifyData.moves]);

	// Track Application State
	const [history, setHistory] = useState<Move[]>([]);
	const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
	const [currentMove, setCurrentMove] = useState<number>(0);
	const [shapes, setShapes] = useState<DrawShape[][]>(
		chessifyData.moves.map((data) => data.shapes)
	);
	const [comments, setComments] = useState<(JSONContent | null)[]>(
		chessifyData.moves.map((data) => data.comment)
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
		},
		[chessView, history]
	);

	const onSaveButtonClick = useCallback(async () => {
		const chessifyData: ChessifyFileData = {
			header: chessifyDataModified.header,
			moves: chessLogic.history({ verbose: true }).map((move, index) => ({
				...move,
				variants: [],
				shapes: shapes[index],
				comment: comments[index],
			})),
		};

		await dataAdapter.saveFile(chessifyData, chessifyId);

		new Notice('Save successfull!');
	}, [
		chessLogic,
		chessifyDataModified.header,
		chessifyId,
		comments,
		dataAdapter,
		shapes,
	]);

	return (
		<div className="border">
			<div
				style={{
					display: 'flex',
					height: '450px',
				}}
			>
				<div
					style={{
						flex: '0 0 450px',
						height: '100%',
					}}
				>
					<ChessgroundWrapper
						api={chessView}
						setApi={setChessView}
						chessifyId={chessifyId}
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
				<div style={{ flex: 1, height: '100%' }}>
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
