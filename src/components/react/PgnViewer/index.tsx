import * as React from 'react';
import { useMemo } from 'react';
import { ChessStudyMove } from 'src/lib/storage';
import { Controls } from './Controls';
import { MoveItem, VariantMoveItem } from './MoveItems';

const chunkArray = <T,>(array: T[], chunkSize: number, offsetByOne = false) => {
	return array.reduce((resultArray, item, index) => {
		const chunkIndex = Math.floor((index + (offsetByOne ? 1 : 0)) / chunkSize);

		if (!resultArray[chunkIndex]) {
			resultArray[chunkIndex] = [];
		}

		resultArray[chunkIndex].push(item);

		return resultArray;
	}, [] as T[][]);
};

export const VariantMoveItemContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <div className="variant-move-item-container">{children}</div>;
};

export const VariantContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <div className="variant-container">{children}</div>;
};

export const VariantsContainer = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	return <div className="variants-container">{children}</div>;
};

interface PgnViewerProps {
	history: ChessStudyMove[];
	currentMoveId: string | null;
	firstPlayer: string;
	initialMoveNumber: number;
	onMoveItemClick: (moveId: string) => void;
	onUndoButtonClick: () => void;
	onBackButtonClick: () => void;
	onForwardButtonClick: () => void;
	onSaveButtonClick: () => void;
	onCopyButtonClick: () => void;
}

export const PgnViewer = React.memo((props: PgnViewerProps) => {
	const {
		history,
		currentMoveId,
		firstPlayer,
		initialMoveNumber,
		onMoveItemClick,
		...controlActions
	} = props;

	const movePairs = useMemo(
		() => chunkArray(history, 2, firstPlayer === 'b'),
		[firstPlayer, history]
	);

	return (
		<div className="height-width-100">
			<div className="move-item-section">
				<div className="move-item-container">
					{movePairs.map((pair, currentMoveIndex) => {
						const [wMove, bMove] = pair;

						return (
							<React.Fragment key={wMove.san + bMove?.san + currentMoveIndex}>
								<p className="move-indicator center">
									{currentMoveIndex + initialMoveNumber}
								</p>
								{firstPlayer === 'b' && !bMove && currentMoveIndex === 0 && (
									<MoveItem
										san={'...'}
										isCurrentMove={false}
										onMoveItemClick={() => {}}
									/>
								)}
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
												{wMove.variants.map((variant) => {
													return (
														<VariantMoveItemContainer key={variant.variantId}>
															{chunkArray(variant.moves, 2).map((pair, wMoveVarianti) => {
																const [bMove, wMove] = pair;

																return (
																	<React.Fragment
																		key={bMove.san + wMove?.san + currentMoveIndex}
																	>
																		<VariantMoveItem
																			isCurrentMove={bMove.moveId === currentMoveId}
																			san={bMove.san}
																			onMoveItemClick={() => onMoveItemClick(bMove.moveId)}
																			moveIndicator={
																				(wMoveVarianti === 0 &&
																					(firstPlayer === 'w' || currentMoveIndex > 0) &&
																					`${
																						currentMoveIndex + initialMoveNumber + wMoveVarianti
																					}... `) ||
																				(firstPlayer === 'b' &&
																					currentMoveIndex === 0 &&
																					`${
																						currentMoveIndex + initialMoveNumber + wMoveVarianti
																					}. `) ||
																				null
																			}
																		/>
																		{wMove && (
																			<VariantMoveItem
																				isCurrentMove={wMove.moveId === currentMoveId}
																				san={wMove.san}
																				onMoveItemClick={() => onMoveItemClick(wMove.moveId)}
																				moveIndicator={
																					((firstPlayer === 'w' || currentMoveIndex > 0) &&
																						`${
																							currentMoveIndex + initialMoveNumber + 1 + wMoveVarianti
																						}. `) ||
																					null
																				}
																			/>
																		)}
																	</React.Fragment>
																);
															})}
														</VariantMoveItemContainer>
													);
												})}
											</VariantContainer>
										)}
										{!!bMove?.variants.length && (
											<VariantContainer>
												{bMove.variants.map((variant) => {
													return (
														<VariantMoveItemContainer key={variant.variantId}>
															{chunkArray(variant.moves, 2).map((pair, bMoveVarianti) => {
																const [wMove, bMove] = pair;
																return (
																	<React.Fragment
																		key={wMove.san + bMove?.san + currentMoveIndex}
																	>
																		<VariantMoveItem
																			isCurrentMove={wMove.moveId === currentMoveId}
																			san={wMove.san}
																			onMoveItemClick={() => onMoveItemClick(wMove.moveId)}
																			moveIndicator={`${
																				currentMoveIndex + initialMoveNumber + 1 + bMoveVarianti
																			}. `}
																		/>
																		{bMove && (
																			<VariantMoveItem
																				isCurrentMove={bMove.moveId === currentMoveId}
																				san={bMove.san}
																				onMoveItemClick={() => onMoveItemClick(bMove.moveId)}
																			/>
																		)}
																	</React.Fragment>
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
			<Controls {...controlActions} />
		</div>
	);
});

PgnViewer.displayName = 'PgnViewer';
