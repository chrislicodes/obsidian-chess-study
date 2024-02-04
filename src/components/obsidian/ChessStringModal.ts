import { App, Modal, Setting } from 'obsidian';
import { ChessString } from 'src/main';

export class ChessStringModal extends Modal {
	chessString: ChessString;
	onSubmit: (pgn: string) => void;

	constructor(app: App, onSubmit: (pgn: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h1', {
			text: 'Paste the full PGN/FEN (leave empty for a new game):',
		});

		new Setting(contentEl).setName('PGN/FEN').addTextArea((text) =>
			text
				.onChange((value) => {
					this.chessString = value;
				})
				.inputEl.setCssStyles({ width: '100%', height: '250px' })
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.chessString);
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
