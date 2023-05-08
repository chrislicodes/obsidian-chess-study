import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Chessground as ChessgroundApi } from "chessground";

import { Api } from "chessground/api";
import { Config } from "chessground/config";
import { Chess } from "chess.js";
import { playOtherSide, toColor, toDests } from "src/utils";

export interface ChessGroundSettings {
	config?: Config;
	boardColor?: "brown" | "green";
}

export function ChessgroundWrapper({
	boardColor = "green",
	config = {},
}: ChessGroundSettings) {
	const [api, setApi] = useState<Api | null>(null);
	const [chess, setChess] = useState<Chess | null>(null);

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current && !api) {
			const chess = config.fen?.length
				? new Chess(config.fen)
				: new Chess();
			const chessgroundApi = ChessgroundApi(ref.current, {
				animation: { enabled: true, duration: 100 },
				movable: {
					free: false,
					color: toColor(chess),
					dests: toDests(chess),
				},
				highlight: {
					check: true,
				},
				turnColor: toColor(chess),
				...config,
			});

			chessgroundApi.set({
				movable: {
					events: { after: playOtherSide(chessgroundApi, chess) },
				},
			});

			setApi(chessgroundApi);
			setChess(chess);
		} else if (ref.current && api) {
			api.set(config);
		}
	}, [ref, chess]);

	useEffect(() => {
		api?.set(config);
		if (config.fen?.length) {
			chess?.load(config.fen);
		}
	}, [api, config]);

	return (
		<div
			style={{
				height: "450px",
				width: "450px",
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
