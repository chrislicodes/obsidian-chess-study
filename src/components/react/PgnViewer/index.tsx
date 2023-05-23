import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { ChessStudyMove } from 'src/lib/storage';

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
				behavior: 'smooth',
				block: 'nearest',
				inline: 'end',
			});
		}
	}, [isCurrentMove]);

	return (
		<p
			className={`move-item ${
				(isCurrentMove && 'active') || ''
			} vertical-align`}
			ref={ref}
			onClick={(e) => {
				e.stopPropagation();
				onMoveItemClick();
			}}
		>
			{san}
		</p>
	);
};

export const PgnViewer = React.memo(
	({
		history,
		currentMoveId,
		onBackButtonClick,
		onForwardButtonClick,
		onMoveItemClick,
		onSaveButtonClick,
	}: {
		history: ChessStudyMove[];
		currentMoveId: string;
		onBackButtonClick: () => void;
		onForwardButtonClick: () => void;
		onMoveItemClick: (moveId: string) => void;
		onSaveButtonClick: () => void;
	}) => {
		const movePairs = useMemo(() => chunkArray(history, 2), [history]);

		return (
			<div className="height-width-100">
				<div className="move-item-section">
					<div className="move-item-container">
						{movePairs.map((pair, i) => {
							const [wMove, bMove] = pair;
							const variants = wMove.variants.concat(bMove?.variants || []);
							return (
								<React.Fragment key={wMove.san + bMove?.san}>
									<p className="move-indicator center">{i + 1}</p>
									<MoveItem
										san={wMove.san}
										isCurrentMove={wMove.moveId === currentMoveId}
										onMoveItemClick={() => onMoveItemClick(wMove.moveId)}
									/>
									{bMove && (
										<MoveItem
											san={bMove.san}
											isCurrentMove={bMove.moveId === currentMoveId}
											onMoveItemClick={() => onMoveItemClick(bMove.moveId)}
										/>
									)}

									{/* Add Variants */}
									{!!variants.length && (
										<div
											style={{
												gridColumn: 'span 3',
												display: 'flex',
												flexDirection: 'column',
											}}
										>
											{variants.map((variant, i) => {
												return (
													<div key={'sd'}>
														{variant.moves.map((move) => (
															<span
																style={{
																	cursor: 'pointer',
																	color:
																		move.moveId === currentMoveId
																			? 'red'
																			: 'unset',
																}}
																onClick={() => onMoveItemClick(move.moveId)}
																key={move.before}
															>
																{move.san}
															</span>
														))}
													</div>
												);
											})}
										</div>
									)}
								</React.Fragment>
							);
						})}
					</div>
				</div>
				<div className="button-section">
					<button onClick={() => onBackButtonClick()}>
						<ArrowLeft />
					</button>
					<button onClick={() => onForwardButtonClick()}>
						<ArrowRight />
					</button>
					<button onClick={() => onSaveButtonClick()}>
						<Save strokeWidth={'1px'} />
					</button>
				</div>
			</div>
		);
	}
);

PgnViewer.displayName = 'PgnViewer';
