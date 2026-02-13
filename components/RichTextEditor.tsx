import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, CheckSquare, Quote } from 'lucide-react';
import { uploadImage } from '../services/imageService';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Prevent cursor jumping by only updating if empty or drastically different
            if (editorRef.current.innerHTML === '' || !editorRef.current.innerHTML) {
                 editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        // Explicitly cast to File[] to avoid unknown type issues with FileList iteration
        const files = Array.from(e.dataTransfer.files) as File[];
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            try {
                const url = await uploadImage(files[0], 'editor_uploads');
                execCommand('insertImage', url);
                handleInput();
            } catch (error) { alert("이미지 업로드 실패"); }
        }
    };

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const url = await uploadImage(file, 'editor_uploads');
                execCommand('insertImage', url);
                handleInput();
            }
        };
        input.click();
    };

    return (
        <div className={`border rounded-xl overflow-hidden bg-white transition-all ${isFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
            {/* Modern Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <ToolbarButton icon={<Heading1 size={16}/>} onClick={() => execCommand('formatBlock', 'H2')} label="대제목" />
                    <ToolbarButton icon={<Heading2 size={16}/>} onClick={() => execCommand('formatBlock', 'H3')} label="소제목" />
                </div>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <ToolbarButton icon={<Bold size={16}/>} onClick={() => execCommand('bold')} label="굵게" />
                    <ToolbarButton icon={<Italic size={16}/>} onClick={() => execCommand('italic')} label="기울임" />
                    <ToolbarButton icon={<Underline size={16}/>} onClick={() => execCommand('underline')} label="밑줄" />
                </div>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <ToolbarButton icon={<AlignLeft size={16}/>} onClick={() => execCommand('justifyLeft')} label="왼쪽" />
                    <ToolbarButton icon={<AlignCenter size={16}/>} onClick={() => execCommand('justifyCenter')} label="중앙" />
                    <ToolbarButton icon={<AlignRight size={16}/>} onClick={() => execCommand('justifyRight')} label="오른쪽" />
                </div>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <ToolbarButton icon={<ListOrdered size={16}/>} onClick={() => execCommand('insertOrderedList')} label="번호리스트" />
                    <ToolbarButton icon={<List size={16}/>} onClick={() => execCommand('insertUnorderedList')} label="점리스트" />
                    <ToolbarButton icon={<Quote size={16}/>} onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} label="인용구" />
                </div>
                <div className="flex-1"></div>
                <button onClick={addImage} className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-800 transition-colors">
                    <ImageIcon size={14}/> 이미지 추가
                </button>
            </div>

            {/* Editor Content */}
            <div 
                ref={editorRef}
                className="min-h-[400px] p-8 outline-none prose prose-sm max-w-none prose-headings:font-black prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic"
                contentEditable
                onInput={handleInput}
                onDrop={handleDrop}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                spellCheck={false}
                dangerouslySetInnerHTML={{ __html: value }}
            />
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, label }: any) => (
    <button type="button" onClick={onClick} title={label} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">{icon}</button>
);