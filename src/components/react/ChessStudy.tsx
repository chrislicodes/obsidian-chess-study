import { JSONContent } from '@tiptap/react';
import { Chess, Move } from 'chess.js';
import { Api } from 'chessground/api';
import { DrawShape } from 'chessground/draw';
import { nanoid } from 'nanoid';
import { App, Notice } from 'obsidian';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ChessStudyPluginSettings } from 'src/components/obsidian/SettingsTab';
import { parseUserConfig } from 'src/lib/obsidian';
import { ChessStudyDataAdapter, ChessStudyFileData } from 'src/lib/storage';
import { useImmerReducer } from 'use-immer';
import { ChessgroundProps, ChessgroundWrapper } from './ChessgroundWrapper';
import { CommentSection } from './CommentSection';
import { PgnViewer } from './PgnViewer';

export type ChessStudyConfig = ChessgroundProps;

interface AppProps {
	source: string;
	app: App;
	pluginSettings: ChessStudyPluginSettings;
	chessStudyData: ChessStudyFileData;
	dataAdapter: ChessStudyDataAdapter;
}

interface GameState {
	currentMove: number;
	currentMoveId: string;
	isViewOnly: boolean;
	study: ChessStudyFileData;
}

type GameActions =
	| { type: 'DISPLAY_NEXT_MOVE_IN_HISTORY' }
	| { type: 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY' }
	| { type: 'DISPLAY_SELECTED_MOVE_IN_HISTORY'; moveNumber: number }
	| { type: 'SYNC_CURRENT_MOVE_ID'; moveId: string }
	| { type: 'SYNC_SHAPES'; shapes: DrawShape[] }
	| { type: 'SYNC_COMMENT'; comment: JSONContent | null }
	| { type: 'ADD_MOVE_TO_HISTORY'; move: Move };

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

	const [gameState, dispatch] = useImmerReducer<GameState, GameActions>(
		(draft, action) => {
			switch (action.type) {
				case 'DISPLAY_NEXT_MOVE_IN_HISTORY': {
					const currentMoveId = draft.currentMoveId;
					const moves = draft.study.moves;
					const moveIndex = draft.study.moves.findIndex(
						(move) => move.moveId === currentMoveId
					);

					if (moveIndex < moves.length - 1) {
						const move = moves[moveIndex + 1];
						const tempChessLogic = new Chess(move.after);

						chessView?.set({
							fen: move.after,
							check: tempChessLogic.isCheck(),
						});

						draft.currentMove = moveIndex + 1;
						draft.currentMoveId = moves[moveIndex + 1].moveId;

						if (moveIndex + 1 === moves.length - 1) draft.isViewOnly = false;
					}

					return draft;
				}
				case 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY': {
					const currentMove = draft.currentMove;
					const moves = draft.study.moves;

					if (currentMove >= 0) {
						const move = moves[currentMove];
						const tempChessLogic = new Chess(move.before);

						chessView?.set({
							fen: move.before,
							check: tempChessLogic.isCheck(),
						});

						draft.isViewOnly = true;
						draft.currentMove = currentMove - 1;
						draft.currentMoveId = moves[currentMove - 1]?.moveId || '';
					}

					return draft;
				}
				case 'DISPLAY_SELECTED_MOVE_IN_HISTORY': {
					const currentMove = draft.currentMove;
					const moves = draft.study.moves;

					const moveIndex = action.moveNumber;

					if (moveIndex !== currentMove) {
						const move = moves[moveIndex];
						const tempChess = new Chess(move.after);

						chessView?.set({
							fen: move.after,
							check: tempChess.isCheck(),
						});

						if (moveIndex !== moves.length - 1) {
							draft.isViewOnly = true;
						} else {
							draft.isViewOnly = false;
						}

						draft.currentMove = moveIndex;
					}

					return draft;
				}

				case 'SYNC_SHAPES': {
					const currentMove = draft.currentMove;
					const moves = draft.study.moves;
					const move = moves[currentMove];

					move.shapes = action.shapes;

					return draft;
				}
				case 'SYNC_COMMENT': {
					const currentMove = draft.currentMove;
					const moves = draft.study.moves;
					const move = moves[currentMove];

					move.comment = action.comment;

					return draft;
				}
				case 'ADD_MOVE_TO_HISTORY': {
					const move = action.move;

					draft.study.moves.push({
						...move,
						moveId: nanoid(),
						variants: [],
						shapes: [],
						comment: null,
					});

					draft.currentMove = draft.currentMove + 1;

					return draft;
				}
				default:
					break;
			}
		},
		{
			currentMove: chessStudyData.moves.length - 1,
			currentMoveId:
				chessStudyData.moves[chessStudyData.moves.length - 1]?.moveId,
			isViewOnly: false,
			study: chessStudyData,
		}
	);

	const onSaveButtonClick = useCallback(async () => {
		try {
			await dataAdapter.saveFile(gameState.study, chessStudyId);
			new Notice('Save successfull!');
		} catch (e) {
			new Notice('Something went wrong during saving:', e);
		}
	}, [chessStudyId, dataAdapter, gameState.study]);

	return (
		<div className="chess-study border">
			<div className="chessground-pgn-container">
				<div className="chessground-container">
					<ChessgroundWrapper
						api={chessView}
						setApi={setChessView}
						config={{
							orientation: boardOrientation,
						}}
						boardColor={boardColor}
						chess={chessLogic}
						addMoveToHistory={(move: Move) =>
							dispatch({ type: 'ADD_MOVE_TO_HISTORY', move })
						}
						isViewOnly={gameState.isViewOnly}
						syncShapes={(shapes: DrawShape[]) =>
							dispatch({ type: 'SYNC_SHAPES', shapes })
						}
						shapes={gameState.study.moves[gameState.currentMove]?.shapes}
					/>
				</div>
				<div className="pgn-container">
					<PgnViewer
						history={gameState.study.moves}
						currentMove={gameState.currentMove}
						onBackButtonClick={() =>
							dispatch({ type: 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY' })
						}
						onForwardButtonClick={() =>
							dispatch({ type: 'DISPLAY_NEXT_MOVE_IN_HISTORY' })
						}
						onMoveItemClick={(moveNumber: number) =>
							dispatch({
								type: 'DISPLAY_SELECTED_MOVE_IN_HISTORY',
								moveNumber: moveNumber,
							})
						}
						onSaveButtonClick={onSaveButtonClick}
					/>
				</div>
			</div>
			<div className="CommentSection border-top">
				<CommentSection
					currentMove={gameState.currentMove}
					currentComment={gameState.study.moves[gameState.currentMove]?.comment}
					setComments={(comment: JSONContent) =>
						dispatch({ type: 'SYNC_COMMENT', comment: comment })
					}
				/>
			</div>
		</div>
	);
};
