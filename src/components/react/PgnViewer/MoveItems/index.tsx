import * as React from 'react';

export const MoveItem = ({
	isCurrentMove,
	san,
	onMoveItemClick,
}: {
	isCurrentMove: boolean;
	san: string;
	onMoveItemClick: () => void;
}) => {
	const ref = React.useRef<HTMLParagraphElement>(null);

	React.useEffect(() => {
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
			className={`move-item ${(isCurrentMove && 'active') || ''} vertical-align`}
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

export const VariantMoveItem = ({
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
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
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
