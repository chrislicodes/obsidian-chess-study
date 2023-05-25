import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import * as React from 'react';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
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

const VariantMoveItem = ({
	isCurrentMove,
	san,
	onMoveItemClick,
	moveIndicator = null,
}: {
	isCurrentMove: boolean;
	san: string;
	onMoveItemClick: () => void;
	moveIndicator?: string | null;
}) => {
	const ref = useRef<HTMLDivElement>(null);

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
		<div
			className={`variant-move-item ${(isCurrentMove && 'active') || ''}`}
			onClick={(e) => {
				e.stopPropagation();
				onMoveItemClick();
			}}
			ref={ref}
		>
			<span className={'variant-move-indicator'}>{moveIndicator}</span>
			{san}
		</div>
	);
};

const VariantMoveItemContainer = ({ children }: { children: ReactNode }) => {
	return <div className="variant-move-item-container">{children}</div>;
};

const VariantContainer = ({ children }: { children: ReactNode }) => {
	return <div className="variant-container">{children}</div>;
};

const VariantsContainer = ({ children }: { children: ReactNode }) => {
	return <div className="variants-container">{children}</div>;
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
						{movePairs.map((pair, currentMoveIndex) => {
							const [wMove, bMove] = pair;

							return (
								<React.Fragment key={wMove.san + bMove?.san}>
									<p className="move-indicator center">
										{currentMoveIndex + 1}
									</p>
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
									{!!wMove.variants.concat(bMove?.variants || []).length && (
										<VariantsContainer>
											{!!wMove.variants.length && (
												<VariantContainer>
													{wMove.variants.map((variant, i) => {
														return (
															<VariantMoveItemContainer key="TODO">
																{chunkArray(variant.moves, 2).map((pair, i) => {
																	const [bMove, wMove] = pair;

																	return (
																		<>
																			<VariantMoveItem
																				key="TODO"
																				isCurrentMove={
																					bMove.moveId === currentMoveId
																				}
																				san={bMove.san}
																				onMoveItemClick={() =>
																					onMoveItemClick(bMove.moveId)
																				}
																				moveIndicator={
																					(i === 0 &&
																						`${
																							currentMoveIndex + 1 + i
																						}... `) ||
																					null
																				}
																			/>
																			{wMove && (
																				<VariantMoveItem
																					key="TODO"
																					isCurrentMove={
																						wMove.moveId === currentMoveId
																					}
																					san={wMove.san}
																					onMoveItemClick={() =>
																						onMoveItemClick(wMove.moveId)
																					}
																					moveIndicator={
																						(i % 2 === 0 && null) ||
																						`${currentMoveIndex + 2 + i}. `
																					}
																				/>
																			)}
																		</>
																	);
																})}
															</VariantMoveItemContainer>
														);
													})}
												</VariantContainer>
											)}
											{!!bMove?.variants.length && (
												<VariantContainer>
													{bMove.variants.map((variant, i) => {
														return (
															<VariantMoveItemContainer key="TODO">
																{chunkArray(variant.moves, 2).map((pair, i) => {
																	const [wMove, bMove] = pair;
																	return (
																		<>
																			<VariantMoveItem
																				key="TODO"
																				isCurrentMove={
																					wMove.moveId === currentMoveId
																				}
																				san={wMove.san}
																				onMoveItemClick={() =>
																					onMoveItemClick(wMove.moveId)
																				}
																				moveIndicator={`${
																					currentMoveIndex + 2 + i
																				}. `}
																			/>
																			{bMove && (
																				<VariantMoveItem
																					key="TODO"
																					isCurrentMove={
																						bMove.moveId === currentMoveId
																					}
																					san={bMove.san}
																					onMoveItemClick={() =>
																						onMoveItemClick(bMove.moveId)
																					}
																				/>
																			)}
																		</>
																	);
																})}
															</VariantMoveItemContainer>
														);
													})}
												</VariantContainer>
											)}
										</VariantsContainer>
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
