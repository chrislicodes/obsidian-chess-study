import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as React from 'react';
import { useEffect } from 'react';

interface CommentSectionProps {
	currentMove: number;
	currentComment: JSONContent | null;
	setComments: React.Dispatch<React.SetStateAction<(JSONContent | null)[]>>;
}

export const CommentSection = React.memo(
	({ currentMove, currentComment, setComments }: CommentSectionProps) => {
		const editor = useEditor({
			extensions: [StarterKit],
			onUpdate: (state) => {
				setComments((currentComments) => {
					const currentCommentModified = [...currentComments];
					currentCommentModified[currentMove] = state.editor.getJSON();
					return currentCommentModified;
				});
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
