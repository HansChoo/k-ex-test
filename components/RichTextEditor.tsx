
import React, { useEffect, useRef, useState } from 'react';
import { 
    Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, 
    Image as ImageIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, 
    Quote, Code, Minus, Type, Palette
} from 'lucide-react';
import { uploadImage } from '../services/imageService';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only update if content is drastically different to prevent cursor jumping
            if (!editorRef.current.innerHTML || value === '') {
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
        handleInput();
    };

    const handleImageUpload = async (file: File) => {
        try {
            // Insert placeholder
            execCommand('insertHTML', '<div class="uploading-placeholder">Image Uploading...</div>');
            
            const url = await uploadImage(file, 'editor_uploads');
            
            // Remove placeholder (this logic assumes simple append, for robust cursor pos need ranges)
            // Ideally, we use the URL directly
            execCommand('undo'); // Remove placeholder text
            execCommand('insertImage', url);
        } catch (error) { 
            alert("이미지 업로드 실패"); 
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            await handleImageUpload(files[0]);
        }
    };

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) await handleImageUpload(file);
        };
        input.click();
    };

    const addLink = () => {
        const url = prompt("링크 주소를 입력하세요 (https://...):");
        if (url) execCommand('createLink', url);
    };

    const COLORS = ['#000000', '#FF0000', '#0000FF', '#008000', '#FFA500', '#808080'];

    return (
        <div className={`border rounded-xl overflow-hidden bg-white transition-all shadow-sm ${isFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}`}>
            {/* Pro Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 select-none">
                {/* Text Style */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <ToolbarButton icon={<Heading1 size={16}/>} onClick={() => execCommand('formatBlock', 'H2')} label="대제목" />
                    <ToolbarButton icon={<Heading2 size={16}/>} onClick={() => execCommand('formatBlock', 'H3')} label="소제목" />
                    <ToolbarButton icon={<Type size={16}/>} onClick={() => execCommand('formatBlock', 'P')} label="본문" />
                </div>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Decoration */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm relative">
                    <ToolbarButton icon={<Bold size={16}/>} onClick={() => execCommand('bold')} label="굵게" />
                    <ToolbarButton icon={<Italic size={16}/>} onClick={() => execCommand('italic')} label="기울임" />
                    <ToolbarButton icon={<Underline size={16}/>} onClick={() => execCommand('underline')} label="밑줄" />
                    <div className="relative">
                        <ToolbarButton icon={<Palette size={16} style={{color: '#E02424'}}/>} onClick={() => setShowColorPicker(!showColorPicker)} label="글자색" />
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 flex gap-1 z-50">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => { execCommand('foreColor', c); setShowColorPicker(false); }} className="w-5 h-5 rounded-full border border-gray-100 hover:scale-110 transition-transform" style={{backgroundColor: c}} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Alignment & Lists */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <ToolbarButton icon={<AlignLeft size={16}/>} onClick={() => execCommand('justifyLeft')} label="왼쪽" />
                    <ToolbarButton icon={<AlignCenter size={16}/>} onClick={() => execCommand('justifyCenter')} label="중앙" />
                    <ToolbarButton icon={<ListOrdered size={16}/>} onClick={() => execCommand('insertOrderedList')} label="번호" />
                    <ToolbarButton icon={<List size={16}/>} onClick={() => execCommand('insertUnorderedList')} label="불렛" />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Inserts */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <ToolbarButton icon={<LinkIcon size={16}/>} onClick={addLink} label="링크" />
                    <ToolbarButton icon={<Quote size={16}/>} onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} label="인용" />
                    <ToolbarButton icon={<Minus size={16}/>} onClick={() => execCommand('insertHorizontalRule')} label="구분선" />
                </div>

                <div className="flex-1"></div>
                <button onClick={addImage} className="flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-800 transition-colors shadow-md">
                    <ImageIcon size={14}/> 사진 첨부
                </button>
            </div>

            {/* Content Area */}
            <div 
                ref={editorRef}
                className="min-h-[500px] max-h-[700px] overflow-y-auto p-8 outline-none prose prose-sm max-w-none 
                prose-headings:font-black prose-headings:text-[#111] prose-headings:mb-4
                prose-p:leading-relaxed prose-p:text-gray-700 prose-p:mb-4
                prose-img:rounded-xl prose-img:shadow-md prose-img:my-6 prose-img:max-w-full
                prose-blockquote:border-l-4 prose-blockquote:border-[#0070F0] prose-blockquote:bg-blue-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700
                prose-a:text-blue-600 prose-a:underline prose-a:font-bold
                prose-li:marker:text-gray-400"
                contentEditable
                onInput={handleInput}
                onDrop={handleDrop}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                spellCheck={false}
                dangerouslySetInnerHTML={{ __html: value }}
                placeholder="내용을 입력하세요..."
            />
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, label }: any) => (
    <button type="button" onClick={onClick} title={label} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">{icon}</button>
);
