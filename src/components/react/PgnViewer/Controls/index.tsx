import { ArrowLeft, ArrowRight, Copy, Save, Undo2 } from 'lucide-react';
import * as React from 'react';

export interface ControlActions {
	onUndoButtonClick: () => void;
	onBackButtonClick: () => void;
	onForwardButtonClick: () => void;
	onSaveButtonClick: () => void;
	onCopyButtonClick: () => void;
}

export const Controls = (props: ControlActions) => {
	return (
		<div>
			<div className="button-section">
				<button onClick={() => props.onBackButtonClick()}>
					<ArrowLeft />
				</button>
				<button onClick={() => props.onForwardButtonClick()}>
					<ArrowRight />
				</button>
				<button onClick={() => props.onSaveButtonClick()}>
					<Save strokeWidth={'1px'} />
				</button>
			</div>
			<div className="button-section">
				<button onClick={() => props.onCopyButtonClick()}>
					<Copy strokeWidth={'1px'} />
				</button>
				<button onClick={() => props.onUndoButtonClick()}>
					<Undo2 />
				</button>
			</div>
		</div>
	);
};
