import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const browserpodTheme = EditorView.theme(
	{
		'&': {
			backgroundColor: '#101012',
			color: '#d4d4d8',
			fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
			fontSize: '13px'
		},
		'.cm-content': {
			caretColor: '#ffffff',
			padding: '8px 0'
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: '#ffffff'
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: '#ffffff15'
		},
		'.cm-panels': {
			backgroundColor: '#090909',
			color: '#d4d4d8'
		},
		'.cm-panels.cm-panels-top': {
			borderBottom: '1px solid #23252a'
		},
		'.cm-panels.cm-panels-bottom': {
			borderTop: '1px solid #23252a'
		},
		'.cm-searchMatch': {
			backgroundColor: '#ffffff20',
			outline: '1px solid #ffffff30'
		},
		'.cm-searchMatch.cm-searchMatch-selected': {
			backgroundColor: '#ffffff30'
		},
		'.cm-activeLine': {
			backgroundColor: '#ffffff08'
		},
		'.cm-selectionMatch': {
			backgroundColor: '#ffffff15'
		},
		'&.cm-focused .cm-matchingBracket': {
			backgroundColor: '#ffffff20',
			outline: '1px solid #ffffff40'
		},
		'.cm-gutters': {
			backgroundColor: '#101012',
			color: '#ffffff30',
			border: 'none'
		},
		'.cm-activeLineGutter': {
			backgroundColor: '#ffffff08',
			color: '#ffffff60'
		},
		'.cm-foldPlaceholder': {
			backgroundColor: 'transparent',
			border: 'none',
			color: '#ffffff40'
		},
		'.cm-tooltip': {
			border: '1px solid #23252a',
			backgroundColor: '#090909',
			color: '#d4d4d8'
		},
		'.cm-tooltip .cm-tooltip-arrow:before': {
			borderTopColor: 'transparent',
			borderBottomColor: 'transparent'
		},
		'.cm-tooltip .cm-tooltip-arrow:after': {
			borderTopColor: '#090909',
			borderBottomColor: '#090909'
		},
		'.cm-tooltip-autocomplete': {
			'& > ul > li[aria-selected]': {
				backgroundColor: '#ffffff15',
				color: '#d4d4d8'
			}
		}
	},
	{ dark: true }
);

const highlightColors = HighlightStyle.define([
	{ tag: tags.keyword, color: '#c792ea' },
	{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#d4d4d8' },
	{ tag: [tags.function(tags.variableName)], color: '#82aaff' },
	{ tag: [tags.labelName], color: '#d4d4d8' },
	{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#f78c6c' },
	{ tag: [tags.definition(tags.name), tags.separator], color: '#d4d4d8' },
	{ tag: [tags.typeName, tags.className, tags.changed, tags.annotation, tags.self, tags.namespace], color: '#ffcb6b' },
	{ tag: [tags.number], color: '#f78c6c' },
	{ tag: [tags.operator, tags.operatorKeyword], color: '#89ddff' },
	{ tag: [tags.url, tags.escape, tags.regexp, tags.link], color: '#c3e88d' },
	{ tag: [tags.meta, tags.comment], color: '#ffffff40' },
	{ tag: tags.strong, fontWeight: 'bold' },
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.strikethrough, textDecoration: 'line-through' },
	{ tag: tags.link, color: '#c3e88d', textDecoration: 'underline' },
	{ tag: tags.heading, fontWeight: 'bold', color: '#82aaff' },
	{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: '#f78c6c' },
	{ tag: [tags.processingInstruction, tags.string, tags.inserted], color: '#c3e88d' },
	{ tag: tags.invalid, color: '#ff5370' }
]);

export const browserpodHighlight = syntaxHighlighting(highlightColors);
