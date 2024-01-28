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
import {
	ChessStudyDataAdapter,
	ChessStudyFileData,
	ChessStudyMove,
	VariantMove,
} from 'src/lib/storage';
import {
	displayMoveInHistory,
	findMoveIndex,
	getCurrentMove,
} from 'src/lib/ui-state';
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

export interface GameState {
	currentMove: ChessStudyMove | VariantMove;
	isViewOnly: boolean;
	study: ChessStudyFileData;
}

export type GameActions =
	| { type: 'ADD_MOVE_TO_HISTORY'; move: Move }
	| { type: 'DISPLAY_NEXT_MOVE_IN_HISTORY' }
	| { type: 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY' }
	| { type: 'DISPLAY_SELECTED_MOVE_IN_HISTORY'; moveId: string }
	| { type: 'SYNC_SHAPES'; shapes: DrawShape[] }
	| { type: 'SYNC_COMMENT'; comment: JSONContent | null };

export const ChessStudy = ({
	source,
	pluginSettings,
	chessStudyData,
	dataAdapter,
}: AppProps) => {
	// Parse Obsidian / Code Block Settings
	const { boardColor, boardOrientation, viewComments, chessStudyId } = parseUserConfig(
		pluginSettings,
		source
	);

	// Setup Chessground API
	const [chessView, setChessView] = useState<Api | null>(null);

	// Setup Chess.js API
	const initialChessLogic = useMemo(() => {
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

	const [chessLogic, setChessLogic] = useState(initialChessLogic);

	const [gameState, dispatch] = useImmerReducer<GameState, GameActions>(
		(draft, action) => {
			switch (action.type) {
				case 'DISPLAY_NEXT_MOVE_IN_HISTORY': {
					if (!chessView) return draft;

					displayMoveInHistory(draft, chessView, setChessLogic, {
						offset: 1,
						selectedMoveId: null,
					});

					return draft;
				}
				case 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY': {
					if (!chessView) return draft;

					displayMoveInHistory(draft, chessView, setChessLogic, {
						offset: -1,
						selectedMoveId: null,
					});

					return draft;
				}
				case 'DISPLAY_SELECTED_MOVE_IN_HISTORY': {
					if (!chessView) return draft;

					const selectedMoveId = action.moveId;

					displayMoveInHistory(draft, chessView, setChessLogic, {
						offset: 0,
						selectedMoveId: selectedMoveId,
					});

					return draft;
				}
				case 'SYNC_SHAPES': {
					const move = getCurrentMove(draft);

					move.shapes = action.shapes;
					draft.currentMove = move;

					return draft;
				}
				case 'SYNC_COMMENT': {
					const move = getCurrentMove(draft);

					move.comment = action.comment;
					draft.currentMove = move;

					return draft;
				}
				case 'ADD_MOVE_TO_HISTORY': {
					const newMove = action.move;

					const moves = draft.study.moves;
					const currentMoveId = draft.currentMove?.moveId;

					const currentMoveIndex = moves.findIndex(
						(move) => move.moveId === currentMoveId
					);

					const { variant, moveIndex } = findMoveIndex(moves, currentMoveId);
					const moveId = nanoid();

					if (variant) {
						//handle variant
						const parent = moves[variant.parentMoveIndex];
						const variantMoves = parent.variants[variant.variantIndex].moves;

						const isLastMove = moveIndex === variantMoves.length - 1;

						//Only push if its the last move in the variant because depth can only be 1
						if (isLastMove) {
							const move = {
								...newMove,
								moveId: moveId,
								shapes: [],
								comment: null,
							};
							variantMoves.push(move);

							const tempChess = new Chess(newMove.after);

							draft.currentMove = move;

							chessView?.set({
								fen: newMove.after,
								check: tempChess.isCheck(),
							});
						}
					} else {
						//handle main line
						const isLastMove = currentMoveIndex === moves.length - 1;

						if (isLastMove) {
							const move = {
								...newMove,
								moveId: moveId,
								variants: [],
								shapes: [],
								comment: null,
							};
							moves.push(move);

							draft.currentMove = move;
						} else {
							const currentMove = moves[moveIndex];

							// check if the next move is the same move
							const nextMove = moves[moveIndex + 1];

							if (nextMove.san === newMove.san) {
								draft.currentMove = nextMove;
								return draft;
							}

							const move = {
								...newMove,
								moveId: moveId,
								shapes: [],
								comment: null,
							};

							currentMove.variants.push({
								parentMoveId: currentMove.moveId,
								variantId: nanoid(),
								moves: [move],
							});

							draft.currentMove = move;
						}
					}

					return draft;
				}
				default:
					break;
			}
		},
		{
			currentMove: chessStudyData.moves[chessStudyData.moves.length - 1],
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
		<div className="chess-study">
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
						shapes={gameState.currentMove?.shapes}
					/>
				</div>
				<div className="pgn-container">
					<PgnViewer
						history={gameState.study.moves}
						currentMoveId={gameState.currentMove?.moveId}
						onBackButtonClick={() =>
							dispatch({ type: 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY' })
						}
						onForwardButtonClick={() =>
							dispatch({ type: 'DISPLAY_NEXT_MOVE_IN_HISTORY' })
						}
						onMoveItemClick={(moveId: string) =>
							dispatch({
								type: 'DISPLAY_SELECTED_MOVE_IN_HISTORY',
								moveId: moveId,
							})
						}
						onSaveButtonClick={onSaveButtonClick}
					/>
				</div>
			</div>
			{ viewComments &&
			<div className="CommentSection">
				<h3>{ viewComments }</h3>
				<CommentSection
					currentComment={gameState.currentMove?.comment}
					setComments={(comment: JSONContent) =>
						dispatch({ type: 'SYNC_COMMENT', comment: comment })
					}
				/>
			</div>
			}
		</div>
	);
};
