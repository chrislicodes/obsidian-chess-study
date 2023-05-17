import { App, Modal, Setting } from 'obsidian';

export class PgnModal extends Modal {
	pgn: string;
	onSubmit: (pgn: string) => void;

	constructor(app: App, onSubmit: (pgn: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h1', {
			text: 'Paste the full PGN (leave empty for a new game):',
		});

		new Setting(contentEl).setName('PGN').addTextArea((text) =>
			text
				.onChange((value) => {
					this.pgn = value;
				})
				.inputEl.setCssStyles({ width: '100%', height: '250px' })
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.pgn);
				})
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
