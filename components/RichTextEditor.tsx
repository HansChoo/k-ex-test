
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize || null,
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
});
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { uploadImage } from '../services/imageService';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered,
  Image as ImageIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Minus, Palette, Highlighter,
  Undo2, Redo2, Code, Youtube as YoutubeIcon,
  Table as TableIcon, Plus,
  Subscript as SubIcon, Superscript as SupIcon,
  Maximize2, Minimize2, Code2, ChevronDown
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF',
  '#FF0000', '#FF4D00', '#FF9900', '#FFCC00', '#FFFF00', '#99FF00', '#00FF00', '#00FF99',
  '#00FFFF', '#0099FF', '#0000FF', '#6600FF', '#9900FF', '#FF00FF', '#FF0099', '#FF0066',
  '#E02424', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777',
];
const HIGHLIGHT_COLORS = [
  '#FEFCE8', '#FEF3C7', '#FFEDD5', '#FEE2E2', '#FCE7F3', '#F3E8FF',
  '#DBEAFE', '#CFFAFE', '#D1FAE5', '#ECFCCB', '#FEF9C3', '#FDE68A',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [wordCount, setWordCount] = useState({ chars: 0, words: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
      Subscript,
      Superscript,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setWordCount({
        chars: editor.storage.characterCount.characters(),
        words: editor.storage.characterCount.words(),
      });
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.dropdown-menu')) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
        setShowFontSize(false);
        setShowTableMenu(false);
        setShowHeadingMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;
      setUploadingImage(true);
      try {
        for (const file of files) {
          const url = await uploadImage(file, 'editor_uploads');
          editor?.chain().focus().setImage({ src: url }).run();
        }
      } catch {
        alert('이미지 업로드에 실패했습니다.');
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  }, [editor]);

  const addYoutubeVideo = useCallback(() => {
    const url = prompt('YouTube 동영상 URL을 입력하세요:');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('링크 URL을 입력하세요:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    setShowFontSize(false);
  }, [editor]);

  const toggleHtmlView = () => {
    if (!editor) return;
    if (!showHtml) {
      setHtmlSource(editor.getHTML());
    } else {
      editor.commands.setContent(htmlSource, { emitUpdate: false });
      onChange(htmlSource);
    }
    setShowHtml(!showHtml);
  };

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setShowTableMenu(false);
  }, [editor]);

  if (!editor) return null;

  const ToolBtn = ({ icon, onClick, active, disabled, label }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-1.5 rounded-md transition-all duration-150 ${
        active ? 'bg-blue-100 text-blue-700 shadow-inner' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
    >
      {icon}
    </button>
  );

  const Divider = () => <div className="w-px h-7 bg-gray-200 mx-0.5 self-center" />;

  return (
    <div
      ref={containerRef}
      className={`border rounded-2xl bg-white transition-all duration-300 shadow-sm flex flex-col overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-[9999] shadow-2xl' : ''
      }`}
    >
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 px-3 py-2 select-none space-y-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          <div className="relative dropdown-menu">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowHeadingMenu(!showHeadingMenu); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 min-w-[90px] justify-between"
            >
              {editor.isActive('heading', { level: 1 }) ? '제목 1' :
               editor.isActive('heading', { level: 2 }) ? '제목 2' :
               editor.isActive('heading', { level: 3 }) ? '제목 3' : '본문'}
              <ChevronDown size={12} />
            </button>
            {showHeadingMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl py-1 z-50 w-40 animate-in">
                <button type="button" onClick={() => { editor.chain().focus().setParagraph().run(); setShowHeadingMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors">본문</button>
                <button type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowHeadingMenu(false); }} className="w-full text-left px-3 py-2 text-xl font-black hover:bg-gray-50 transition-colors">제목 1</button>
                <button type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowHeadingMenu(false); }} className="w-full text-left px-3 py-2 text-lg font-bold hover:bg-gray-50 transition-colors">제목 2</button>
                <button type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setShowHeadingMenu(false); }} className="w-full text-left px-3 py-2 text-base font-semibold hover:bg-gray-50 transition-colors">제목 3</button>
              </div>
            )}
          </div>

          <div className="relative dropdown-menu">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowFontSize(!showFontSize); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 min-w-[65px] justify-between"
            >
              크기 <ChevronDown size={12} />
            </button>
            {showFontSize && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl py-1 z-50 w-32 max-h-60 overflow-y-auto animate-in">
                {FONT_SIZES.map(size => (
                  <button key={size} type="button" onClick={() => setFontSize(size)} className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors" style={{ fontSize: size }}>
                    {parseInt(size)}pt
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          <ToolBtn icon={<Bold size={16}/>} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="굵게 (Ctrl+B)" />
          <ToolBtn icon={<Italic size={16}/>} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="기울임 (Ctrl+I)" />
          <ToolBtn icon={<UnderlineIcon size={16}/>} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="밑줄 (Ctrl+U)" />
          <ToolBtn icon={<Strikethrough size={16}/>} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label="취소선" />

          <Divider />

          <div className="relative dropdown-menu">
            <ToolBtn icon={<Palette size={16}/>} onClick={(e: any) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }} label="글자 색상" />
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 w-[220px] animate-in">
                <div className="text-xs font-bold text-gray-500 mb-2">글자 색상</div>
                <div className="grid grid-cols-8 gap-1">
                  {TEXT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-200 hover:scale-125 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="mt-2 text-xs text-gray-500 hover:text-gray-900 w-full text-center py-1 hover:bg-gray-50 rounded">색상 초기화</button>
              </div>
            )}
          </div>

          <div className="relative dropdown-menu">
            <ToolBtn icon={<Highlighter size={16}/>} onClick={(e: any) => { e.stopPropagation(); setShowHighlightPicker(!showHighlightPicker); }} active={editor.isActive('highlight')} label="형광펜" />
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 w-[180px] animate-in">
                <div className="text-xs font-bold text-gray-500 mb-2">형광펜 색상</div>
                <div className="grid grid-cols-6 gap-1.5">
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false); }} className="w-6 h-6 rounded border border-gray-200 hover:scale-125 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button type="button" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }} className="mt-2 text-xs text-gray-500 hover:text-gray-900 w-full text-center py-1 hover:bg-gray-50 rounded">제거</button>
              </div>
            )}
          </div>

          <ToolBtn icon={<SubIcon size={16}/>} onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} label="아래 첨자" />
          <ToolBtn icon={<SupIcon size={16}/>} onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} label="위 첨자" />

          <Divider />

          <ToolBtn icon={<AlignLeft size={16}/>} onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} label="왼쪽 정렬" />
          <ToolBtn icon={<AlignCenter size={16}/>} onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} label="가운데 정렬" />
          <ToolBtn icon={<AlignRight size={16}/>} onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} label="오른쪽 정렬" />
          <ToolBtn icon={<AlignJustify size={16}/>} onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} label="양쪽 정렬" />
        </div>

        <div className="flex flex-wrap items-center gap-0.5">
          <ToolBtn icon={<List size={16}/>} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="글머리 기호" />
          <ToolBtn icon={<ListOrdered size={16}/>} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="번호 목록" />
          <ToolBtn icon={<Quote size={16}/>} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="인용문" />
          <ToolBtn icon={<Code size={16}/>} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="코드 블록" />
          <ToolBtn icon={<Minus size={16}/>} onClick={() => editor.chain().focus().setHorizontalRule().run()} label="구분선" />

          <Divider />

          <ToolBtn icon={<LinkIcon size={16}/>} onClick={addLink} active={editor.isActive('link')} label="링크 삽입" />

          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploadingImage}
            title="이미지 삽입"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              uploadingImage ? 'bg-gray-200 text-gray-400' : 'bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-sm'
            }`}
          >
            <ImageIcon size={14} />
            {uploadingImage ? '업로드 중...' : '사진'}
          </button>

          <button
            type="button"
            onClick={addYoutubeVideo}
            title="YouTube 동영상"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all active:scale-95 shadow-sm"
          >
            <YoutubeIcon size={14} /> 동영상
          </button>

          <div className="relative dropdown-menu">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowTableMenu(!showTableMenu); }}
              title="표 삽입"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-sm"
            >
              <TableIcon size={14} /> 표
            </button>
            {showTableMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 w-48 animate-in">
                <button type="button" onClick={insertTable} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2"><Plus size={14}/> 3x3 표 삽입</button>
                {editor.isActive('table') && (
                  <>
                    <hr className="my-1 border-gray-100"/>
                    <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 rounded-lg">열 추가</button>
                    <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 rounded-lg">행 추가</button>
                    <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 rounded-lg text-red-500">열 삭제</button>
                    <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 rounded-lg text-red-500">행 삭제</button>
                    <button type="button" onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 rounded-lg text-red-500 font-bold">표 삭제</button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <ToolBtn icon={<Undo2 size={16}/>} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="실행 취소 (Ctrl+Z)" />
          <ToolBtn icon={<Redo2 size={16}/>} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="다시 실행 (Ctrl+Y)" />

          <Divider />

          <ToolBtn icon={<Code2 size={16}/>} onClick={toggleHtmlView} active={showHtml} label="HTML 보기" />
          <ToolBtn icon={isFullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} onClick={() => setIsFullscreen(!isFullscreen)} label="전체 화면" />
        </div>
      </div>

      {showHtml ? (
        <textarea
          value={htmlSource}
          onChange={(e) => setHtmlSource(e.target.value)}
          className="flex-1 min-h-[450px] p-6 font-mono text-sm outline-none resize-none bg-gray-900 text-green-400"
          spellCheck={false}
        />
      ) : (
        <EditorContent
          editor={editor}
          className="tiptap-editor-content flex-1 min-h-[450px] max-h-[700px] overflow-y-auto cursor-text"
        />
      )}

      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono rounded-b-2xl">
        <span>{wordCount.chars}자 · {wordCount.words}단어</span>
        <span className="flex items-center gap-3">
          {uploadingImage && <span className="text-blue-500 animate-pulse">이미지 업로드 중...</span>}
          <span>Tiptap Editor</span>
        </span>
      </div>
    </div>
  );
};
