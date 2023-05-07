import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Chessground as ChessgroundApi } from "chessground";

import { Api } from "chessground/api";
import { Config } from "chessground/config";

export interface ChessGroundSettings {
	config?: Config;
	boardColor?: "brown" | "green";
}

export function ChessgroundWrapper({
	boardColor = "green",
	config = {},
}: ChessGroundSettings) {
	const [api, setApi] = useState<Api | null>(null);

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref && ref.current && !api) {
			//Render the Chessboard
			const chessgroundApi = ChessgroundApi(ref.current, {
				animation: { enabled: true, duration: 100 },
				...config,
			});

			setApi(chessgroundApi);
		} else if (ref && ref.current && api) {
			api.set(config);
		}
	}, [ref]);

	useEffect(() => {
		api?.set(config);
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
