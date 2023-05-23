import { Chess, Move } from 'chess.js';
import { Chessground as ChessgroundApi } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { DrawShape } from 'chessground/draw';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { playOtherSide, toColor, toDests } from 'src/lib/chess-logic';

export interface ChessgroundProps {
	api: Api | null;
	setApi: React.Dispatch<React.SetStateAction<Api>>;
	chess: Chess;
	addMoveToHistory: (move: Move) => void;
	syncShapes: (shapes: DrawShape[]) => void;
	isViewOnly: boolean;
	shapes: DrawShape[];
	config?: Config;
	boardColor?: 'brown' | 'green';
}

export const ChessgroundWrapper = React.memo(
	({
		api,
		setApi,
		chess,
		addMoveToHistory,
		syncShapes: setShapes,
		isViewOnly,
		shapes,
		boardColor = 'green',
		config = {},
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
					},
					highlight: {
						check: true,
					},
					drawable: {
						onChange: (shapes) => {
							setShapes(shapes);
						},
					},
					turnColor: toColor(chess),
					...config,
				});

				setApi(chessgroundApi);
			} else if (ref.current && api) {
				api.set(config);
			}
		}, [addMoveToHistory, api, chess, config, setApi, setShapes]);

		//Sync Chess Logic
		useEffect(() => {
			api?.set({
				movable: {
					events: {
						//Hook up the Chessground UI changes to our App State
						after: (orig, dest, _metadata) => {
							const handler = playOtherSide(api, chess);

							addMoveToHistory(handler(orig, dest));
						},
					},
				},
			});
		}, [addMoveToHistory, api, chess]);

		//Sync View Only
		useEffect(() => {
			api?.set({ viewOnly: isViewOnly });
		}, [isViewOnly, api]);

		// Load Shapes
		useEffect(() => {
			if (shapes) {
				api?.setShapes([...shapes]);
			}
		}, [api, shapes]);

		return (
			<div className={`${boardColor}-board height-width-100 table`}>
				<div ref={ref} className={`height-width-100`} />
			</div>
		);
	}
);

ChessgroundWrapper.displayName = 'ChessgroundWrapper';
