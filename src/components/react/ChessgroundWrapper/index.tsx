import { Chessground as ChessgroundApi } from "chessground";
import * as React from "react";
import { useEffect, useRef } from "react";

import { Chess, Move } from "chess.js";
import { Api } from "chessground/api";
import { Config } from "chessground/config";
import { DrawShape } from "chessground/draw";
import { playOtherSide, toColor, toDests } from "src/utils";

export interface ChessGroundSettings {
	api: Api | null;
	setApi: React.Dispatch<React.SetStateAction<Api>>;
	chessifyId: string;
	config?: Config;
	boardColor?: "brown" | "green";
	chess: Chess;
	setHistory: React.Dispatch<React.SetStateAction<Move[]>>;
	setShapes: React.Dispatch<React.SetStateAction<DrawShape[][]>>;
	setMoveNumber: React.Dispatch<React.SetStateAction<number>>;
	currentMoveNumber: number;
	isViewOnly: boolean;
	currentMoveShapes: DrawShape[];
}

export function ChessgroundWrapper({
	api,
	setApi,
	chessifyId,
	boardColor = "green",
	config = {},
	chess,
	setHistory,
	setMoveNumber,
	currentMoveNumber,
	setShapes,
	isViewOnly,
	currentMoveShapes,
}: ChessGroundSettings) {
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
							const handler = playOtherSide(
								chessgroundApi,
								chess
							);

							setHistory(handler(orig, dest));
							setMoveNumber((state) => state + 1);
						},
					},
				},
				highlight: {
					check: true,
				},
				turnColor: toColor(chess),
				...config,
			});

			setHistory(chess.history({ verbose: true }));
			setApi(chessgroundApi);
			setMoveNumber(chess.history().length - 1);
		} else if (ref.current && api) {
			api.set(config);
		}
	}, [
		ref,
		chess,
		api,
		chessifyId,
		config,
		setApi,
		setHistory,
		setMoveNumber,
		setShapes,
		currentMoveNumber,
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
		<div
			style={{
				height: "100%",
				width: "100%",
			}}
			className={`${boardColor}-board`}
		>
			<div
				ref={ref}
				style={{
					height: "100%",
					width: "100%",
					display:
						"table" /* hack: round to full pixel size in chrome */,
				}}
			/>
		</div>
	);
}
