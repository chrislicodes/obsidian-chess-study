import { JSONContent } from '@tiptap/react';
import { Chess, Move } from 'chess.js';
import { Api } from 'chessground/api';
import { DrawShape } from 'chessground/draw';
import { nanoid } from 'nanoid';
import { App, Notice } from 'obsidian';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ChessStudyPluginSettings } from 'src/components/obsidian/SettingsTab';
import { playOtherSide, toColor, toDests } from 'src/lib/chess-logic';
import { parseUserConfig } from 'src/lib/obsidian';
import {
	ChessStudyDataAdapter,
	ChessStudyFileData,
	ChessStudyMove,
} from 'src/lib/storage';
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
	// put here the actual current move
	isViewOnly: boolean;
	study: ChessStudyFileData;
}

interface MovePosition {
	variant: { parentMoveIndex: number; variantIndex: number } | null;
	moveIndex: number;
}

type GameActions =
	| { type: 'DISPLAY_NEXT_MOVE_IN_HISTORY' }
	| { type: 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY' }
	| { type: 'DISPLAY_SELECTED_MOVE_IN_HISTORY'; moveId: string }
	| { type: 'SYNC_CURRENT_MOVE_ID'; moveId: string }
	| { type: 'SYNC_SHAPES'; shapes: DrawShape[] }
	| { type: 'SYNC_COMMENT'; comment: JSONContent | null }
	| { type: 'ADD_MOVE_TO_HISTORY'; move: Move };

const findMoveIndex = (
	moves: ChessStudyMove[],
	moveId: string
): MovePosition => {
	for (const [iMainLine, move] of moves.entries()) {
		if (move.moveId === moveId) return { variant: null, moveIndex: iMainLine };

		for (const [iVariant, variant] of move.variants.entries()) {
			const moveIndex = variant.moves.findIndex(
				(move) => move.moveId === moveId
			);

			if (moveIndex >= 0)
				return {
					variant: { parentMoveIndex: iMainLine, variantIndex: iVariant },
					moveIndex: moveIndex,
				};
		}
	}

	return { variant: null, moveIndex: -1 };
};

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

	// Setup Chessboard and Chess.js APIs
	const [chessView, setChessView] = useState<Api | null>(null);

	//? Maybe remodel all of the moves as a tree
	const [gameState, dispatch] = useImmerReducer<GameState, GameActions>(
		(draft, action) => {
			switch (action.type) {
				case 'DISPLAY_NEXT_MOVE_IN_HISTORY': {
					//TODO: chess.js
					const currentMoveId = draft.currentMoveId;
					const moves = draft.study.moves;

					const { variant, moveIndex } = findMoveIndex(moves, currentMoveId);

					if (variant) {
						const variantMoves =
							moves[variant.parentMoveIndex].variants[variant.variantIndex]
								.moves;

						if (moveIndex < variantMoves.length - 1) {
							const move = variantMoves[moveIndex + 1];
							const tempChessLogic = new Chess(move.after);

							chessView?.set({
								fen: move.after,
								check: tempChessLogic.isCheck(),
							});

							draft.currentMove = moveIndex + 1;
							draft.currentMoveId = variantMoves[moveIndex + 1].moveId;
						}
					} else {
						if (moveIndex < moves.length - 1) {
							const move = moves[moveIndex + 1];
							const tempChessLogic = new Chess(move.after);

							chessView?.set({
								fen: move.after,
								check: tempChessLogic.isCheck(),
							});

							draft.currentMove = moveIndex + 1;
							draft.currentMoveId = moves[moveIndex + 1].moveId;
						}
					}

					return draft;
				}
				case 'DISPLAY_PREVIOUS_MOVE_IN_HISTORY': {
					//TODO: chess.js
					const currentMoveId = draft.currentMoveId;
					const moves = draft.study.moves;

					const { variant, moveIndex } = findMoveIndex(moves, currentMoveId);

					if (variant) {
						const variantMoves =
							moves[variant.parentMoveIndex].variants[variant.variantIndex]
								.moves;

						if (moveIndex > 0) {
							const move = variantMoves[moveIndex];
							const tempChessLogic = new Chess(move.before);

							chessView?.set({
								fen: move.before,
								check: tempChessLogic.isCheck(),
							});

							draft.currentMove = moveIndex - 1;
							draft.currentMoveId = variantMoves[moveIndex - 1].moveId;
						}
					} else {
						if (moveIndex > 0) {
							const move = moves[moveIndex];
							const tempChessLogic = new Chess(move.before);

							chessView?.set({
								fen: move.before,
								check: tempChessLogic.isCheck(),
							});

							draft.currentMove = moveIndex - 1;
							draft.currentMoveId = moves[moveIndex - 1].moveId;
						}
					}

					return draft;
				}
				case 'DISPLAY_SELECTED_MOVE_IN_HISTORY': {
					const currentMoveId = draft.currentMoveId;
					const moves = draft.study.moves;

					const moveId = action.moveId;

					const { variant, moveIndex } = findMoveIndex(moves, moveId);

					if (currentMoveId === moveId) return draft;

					if (variant) {
						const parent = moves[variant.parentMoveIndex];
						const variantMoves = parent.variants[variant.variantIndex].moves;

						const move = variantMoves[moveIndex];

						const chess = new Chess(move.after);

						//TODO: Make viewOnly if its not the last move in the variant
						chessView?.set({
							fen: move.after,
							check: chess.isCheck(),
							movable: {
								free: false,
								color: toColor(chess),
								dests: toDests(chess),
								events: {
									//Hook up the Chessground UI changes to our App State
									after: (orig, dest, _metadata) => {
										const handler = playOtherSide(chessView, chess);

										dispatch({
											type: 'ADD_MOVE_TO_HISTORY',
											move: handler(orig, dest),
										});
									},
								},
							},
							turnColor: toColor(chess),
						});

						draft.currentMove = moveIndex;
						draft.currentMoveId = move.moveId;
					} else {
						const move = moves[moveIndex];

						const chess = new Chess(move.after);

						chessView?.set({
							fen: move.after,
							check: chess.isCheck(),
							movable: {
								free: false,
								color: toColor(chess),
								dests: toDests(chess),
								events: {
									//Hook up the Chessground UI changes to our App State
									after: (orig, dest, _metadata) => {
										const handler = playOtherSide(chessView, chess);

										dispatch({
											type: 'ADD_MOVE_TO_HISTORY',
											move: handler(orig, dest),
										});
									},
								},
							},
							turnColor: toColor(chess),
						});
						draft.currentMove = moveIndex;
						draft.currentMoveId = move.moveId;
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
					const newMove = action.move;

					const moves = draft.study.moves;
					const currentMoveId = draft.currentMoveId;

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
							variantMoves.push({
								...newMove,
								moveId: moveId,
								shapes: [],
								comment: null,
							});

							const tempChess = new Chess(newMove.after);

							draft.currentMove = draft.currentMove + 1;
							draft.currentMoveId = moveId;
							chessView?.set({
								fen: newMove.after,
								check: tempChess.isCheck(),
							});
						}
					} else {
						//handle main line
						const isLastMove = currentMoveIndex === moves.length - 1;

						if (isLastMove) {
							moves.push({
								...newMove,
								moveId: moveId,
								variants: [],
								shapes: [],
								comment: null,
							});

							draft.currentMove = draft.currentMove + 1;
							draft.currentMoveId = moveId;
						} else {
							const currentMove = moves[moveIndex];

							//check if a variant with this first move already exists
							const sameVariant = currentMove.variants.findIndex(
								(variant) => variant.moves[0]?.san === newMove.san
							);
							if (sameVariant >= 0) {
								draft.currentMoveId =
									currentMove.variants[sameVariant].moves[0].moveId;
							} else {
								currentMove.variants.push({
									parentMoveId: currentMove.moveId,
									variantId: nanoid(),
									moves: [
										{ ...newMove, moveId: moveId, shapes: [], comment: null },
									],
								});

								draft.currentMoveId = moveId;
							}
						}
					}

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
						currentMoveId={gameState.currentMoveId}
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
