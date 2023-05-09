import { Move } from "chess.js";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useRef } from "react";

const chunkArray = <T,>(array: T[], chunkSize: number) => {
	return array.reduce((resultArray, item, index) => {
		const chunkIndex = Math.floor(index / chunkSize);

		if (!resultArray[chunkIndex]) {
			resultArray[chunkIndex] = [];
		}

		resultArray[chunkIndex].push(item);

		return resultArray;
	}, [] as T[][]);
};

const MoveItem = ({
	isCurrentMove,
	san,
	onMoveItemClick,
}: {
	isCurrentMove: boolean;
	san: string;
	onMoveItemClick: () => void;
}) => {
	const ref = useRef<HTMLParagraphElement>(null);

	useEffect(() => {
		if (ref.current && isCurrentMove) {
			ref.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "end",
			});
		}
	}, [isCurrentMove]);

	return (
		<p
			className={`move-item ${
				(isCurrentMove && "active") || ""
			} vertical-align`}
			ref={ref}
			onClick={() => onMoveItemClick()}
		>
			{san}
		</p>
	);
};

export const PgnViewer = ({
	history,
	currentMove,
	onBackButtonClick,
	onForwardButtonClick,
	onMoveItemClick,
}: {
	history: Move[];
	currentMove: number;
	onBackButtonClick: () => void;
	onForwardButtonClick: () => void;
	onMoveItemClick: (moveIndex: number) => void;
}) => {
	const movePairs = useMemo(() => chunkArray(history, 2), [history]);

	return (
		<div style={{ width: "100%", height: "100%" }}>
			<div style={{ height: "415px" }}>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "0.15fr 0.425fr 0.425fr",
						gridAutoRows: "30px",
						width: "100%",
						maxHeight: "415px",
						overflowY: "scroll",
					}}
				>
					{movePairs.map((pair, i) => {
						const [wMove, bMove] = pair;
						return (
							<React.Fragment key={wMove.san + bMove?.san}>
								<p className="move-indicator center">{i + 1}</p>
								<MoveItem
									san={wMove.san}
									isCurrentMove={i * 2 === currentMove}
									onMoveItemClick={() =>
										onMoveItemClick(i * 2)
									}
								/>
								{bMove && (
									<MoveItem
										san={bMove.san}
										isCurrentMove={
											i * 2 + 1 === currentMove
										}
										onMoveItemClick={() =>
											onMoveItemClick(i * 2 + 1)
										}
									/>
								)}
							</React.Fragment>
						);
					})}
				</div>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					width: "100%",
					gap: "4px",
					height: "35px",
				}}
			>
				<button onClick={() => onBackButtonClick()}>
					<ArrowLeft />
				</button>
				<button onClick={() => onForwardButtonClick()}>
					<ArrowRight />
				</button>
			</div>
		</div>
	);
};
