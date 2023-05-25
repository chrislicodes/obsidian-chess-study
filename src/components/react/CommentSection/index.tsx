import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as React from 'react';
import { useEffect } from 'react';

interface CommentSectionProps {
	currentComment: JSONContent | null;
	setComments: (comment: JSONContent) => void;
}

export const CommentSection = React.memo(
	({ currentComment, setComments }: CommentSectionProps) => {
		const editor = useEditor({
			extensions: [StarterKit],
			onUpdate: (state) => {
				const comment = state.editor.getJSON();
				if (comment) setComments(comment);
			},
		});

		useEffect(() => {
			if (!editor) return;
			const { from, to } = editor.state.selection;
			if (currentComment) {
				editor.commands.setContent(currentComment, false, {
					preserveWhitespace: true,
				});
			} else {
				editor.commands.clearContent();
			}
			editor.commands.setTextSelection({ from, to });
		}, [currentComment, editor]);

		return <EditorContent editor={editor} />;
	}
);

CommentSection.displayName = 'CommentSection';
