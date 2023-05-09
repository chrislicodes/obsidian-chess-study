import { Chess, Move } from "chess.js";
import { Api } from "chessground/api";
import { App } from "obsidian";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { ChessifyPluginSettings } from "src/components/obsidian/SettingsTab";
import { ChessifyFileData, parseUserConfig } from "src/utils";
import { ChessGroundSettings, ChessgroundWrapper } from "./ChessgroundWrapper";
import { PgnViewer } from "./PgnViewer";

export type ChessifyConfig = ChessGroundSettings;

interface AppProps {
	source: string;
	app: App;
	pluginSettings: ChessifyPluginSettings;
	chessifyData: ChessifyFileData;
}

export const Chessify = ({
	source,
	pluginSettings,
	chessifyData,
}: AppProps) => {
	// Parse Obsidian / Code Block Settings
	const { boardColor, boardOrientation, chessifyId } = parseUserConfig(
		pluginSettings,
		source
	);

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
				if (currentMove + 1 === history.length - 1)
					setIsViewOnly(false);
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
				if (moveIndex + 1 !== history.length - 1) {
					setIsViewOnly(false);
				} else {
					setIsViewOnly(true);
				}

				return moveIndex;
			});
		},
		[chessView, history]
	);

	return (
		<div
			style={{
				display: "flex",
				height: "450px",
			}}
		>
			<div
				style={{
					flex: "0 0 450px",
					height: "100%",
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
				/>
			</div>
			<div style={{ flex: 1, height: "100%" }}>
				<PgnViewer
					history={history}
					currentMove={currentMove}
					onBackButtonClick={onBackButtonClick}
					onForwardButtonClick={onForwardButtonClick}
					onMoveItemClick={onMoveItemClick}
				/>
			</div>
		</div>
	);
};
