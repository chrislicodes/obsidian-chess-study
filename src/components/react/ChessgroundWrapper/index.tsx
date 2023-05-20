import { Chessground as ChessgroundApi } from 'chessground';
import * as React from 'react';
import { useEffect, useRef } from 'react';

import { Chess, Move } from 'chess.js';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import { playOtherSide, toColor, toDests } from 'src/lib/chess-logic';

export interface ChessgroundProps {
	api: Api | null;
	setApi: React.Dispatch<React.SetStateAction<Api>>;
	chessStudyId: string;
	config?: Config;
	boardColor?: 'brown' | 'green';
	chess: Chess;
	addMoveToHistory: React.Dispatch<React.SetStateAction<Move>>;
	setShapes: React.Dispatch<React.SetStateAction<DrawShape[][]>>;
	setMoveNumber: React.Dispatch<React.SetStateAction<number>>;
	currentMoveNumber: number;
	isViewOnly: boolean;
	currentMoveShapes: DrawShape[];
}

export const ChessgroundWrapper = React.memo(
	({
		api,
		setApi,
		chessStudyId,
		boardColor = 'green',
		config = {},
		chess,
		addMoveToHistory,
		setMoveNumber,
		currentMoveNumber,
		setShapes,
		isViewOnly,
		currentMoveShapes,
	}: ChessgroundProps) => {
		const ref = useRef<HTMLDivElement>(null);

		//Chessground Init
		useEffect(() => {
			if (ref.current && !api) {
				const chessgroundApi = ChessgroundApi(ref.current, {
					fen: chess.fen(),
					animation: { enabled: true, duration: 100 },
					check: chess.isCheck(),
					movable: {
						free: false,
						color: toColor(chess),
						dests: toDests(chess),
						events: {
							//Hook up the Chessground UI changes to our App State
							after: (orig, dest, _metadata) => {
								const handler = playOtherSide(chessgroundApi, chess);

								addMoveToHistory(handler(orig, dest));
							},
						},
					},
					highlight: {
						check: true,
					},
					turnColor: toColor(chess),
					...config,
				});

				setApi(chessgroundApi);
				setMoveNumber(chess.history().length - 1);
			} else if (ref.current && api) {
				api.set(config);
			}
		}, [
			ref,
			chess,
			api,
			chessStudyId,
			config,
			setApi,
			setMoveNumber,
			setShapes,
			currentMoveNumber,
			addMoveToHistory,
		]);

		//Sync View Only
		useEffect(() => {
			api?.set({ viewOnly: isViewOnly });
		}, [isViewOnly, api]);

		//Sync Shapes To State
		useEffect(() => {
			api?.set({
				drawable: {
					onChange(shapes) {
						setShapes((currentShapes) => {
							const shapesModified = [...currentShapes];
							shapesModified[currentMoveNumber] = shapes;

							return shapesModified;
						});
					},
				},
			});
		}, [api, currentMoveNumber, setShapes]);

		//Load Shapes
		useEffect(() => {
			if (currentMoveShapes) api?.setShapes(currentMoveShapes);
		}, [api, currentMoveNumber, currentMoveShapes, setShapes]);

		return (
			<div className={`${boardColor}-board height-width-100 table`}>
				<div ref={ref} className={`height-width-100`} />
			</div>
		);
	}
);

ChessgroundWrapper.displayName = 'ChessgroundWrapper';
