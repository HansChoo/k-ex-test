
import React, { useEffect, useRef, useState } from 'react';
import { 
    Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, 
    Image as ImageIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, 
    Quote, Minus, Type, Palette
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
            // Only update if content is significantly different to prevent cursor jumps
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
        const id = Math.random().toString(36).substr(2, 9);
        try {
            // Insert placeholder
            execCommand('insertHTML', `<img id="${id}" src="https://via.placeholder.com/150?text=Uploading..." class="opacity-50 max-w-full rounded-lg" />`);
            
            const url = await uploadImage(file, 'editor_uploads');
            
            // Replace placeholder with real image
            const img = document.getElementById(id);
            if (img) {
                img.setAttribute('src', url);
                img.classList.remove('opacity-50');
                handleInput();
            }
        } catch (error) { 
            alert("이미지 업로드 실패"); 
            const img = document.getElementById(id); // Cleanup if failed
            if(img) img.remove();
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files) as File[];
        if (files.length > 0 && files[0].type.startsWith('image/')) {
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

    const COLORS = ['#000000', '#E02424', '#0E9F6E', '#3F83F8', '#FF5A1F', '#6B7280', '#9061F9'];

    return (
        <div className={`border rounded-xl overflow-hidden bg-white transition-all shadow-sm flex flex-col ${isFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 select-none sticky top-0 z-10">
                
                {/* Text Formatting */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <ToolbarButton icon={<Heading1 size={16}/>} onClick={() => execCommand('formatBlock', 'H2')} label="Heading 1" />
                    <ToolbarButton icon={<Heading2 size={16}/>} onClick={() => execCommand('formatBlock', 'H3')} label="Heading 2" />
                    <ToolbarButton icon={<Type size={16}/>} onClick={() => execCommand('formatBlock', 'P')} label="Paragraph" />
                </div>
                
                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Decorations */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm relative">
                    <ToolbarButton icon={<Bold size={16}/>} onClick={() => execCommand('bold')} label="Bold" />
                    <ToolbarButton icon={<Italic size={16}/>} onClick={() => execCommand('italic')} label="Italic" />
                    <ToolbarButton icon={<Underline size={16}/>} onClick={() => execCommand('underline')} label="Underline" />
                    <div className="relative group">
                        <ToolbarButton icon={<Palette size={16} style={{color: '#E02424'}}/>} onClick={() => setShowColorPicker(!showColorPicker)} label="Color" />
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 flex gap-1 z-50 animate-fade-in">
                                {COLORS.map(c => (
                                    <button key={c} type="button" onClick={() => { execCommand('foreColor', c); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-100 hover:scale-110 transition-transform shadow-sm" style={{backgroundColor: c}} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Alignment & Lists */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <ToolbarButton icon={<AlignLeft size={16}/>} onClick={() => execCommand('justifyLeft')} label="Align Left" />
                    <ToolbarButton icon={<AlignCenter size={16}/>} onClick={() => execCommand('justifyCenter')} label="Align Center" />
                    <ToolbarButton icon={<ListOrdered size={16}/>} onClick={() => execCommand('insertOrderedList')} label="Ordered List" />
                    <ToolbarButton icon={<List size={16}/>} onClick={() => execCommand('insertUnorderedList')} label="Bulleted List" />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Inserts */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <ToolbarButton icon={<LinkIcon size={16}/>} onClick={addLink} label="Link" />
                    <ToolbarButton icon={<Quote size={16}/>} onClick={() => execCommand('formatBlock', 'BLOCKQUOTE')} label="Quote" />
                    <ToolbarButton icon={<Minus size={16}/>} onClick={() => execCommand('insertHorizontalRule')} label="Divider" />
                </div>

                <div className="flex-1"></div>
                
                <button type="button" onClick={addImage} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] text-white rounded-md text-xs font-bold hover:bg-black transition-colors shadow-md active:scale-95">
                    <ImageIcon size={14}/> Image
                </button>
            </div>

            {/* Editor Area */}
            <div 
                ref={editorRef}
                className="min-h-[400px] max-h-[600px] overflow-y-auto p-8 outline-none prose prose-sm max-w-none 
                prose-headings:font-black prose-headings:text-[#111] prose-headings:mb-4 prose-headings:mt-6
                prose-p:leading-relaxed prose-p:text-gray-700 prose-p:mb-4
                prose-img:rounded-xl prose-img:shadow-md prose-img:my-6 prose-img:max-w-full prose-img:border prose-img:border-gray-100
                prose-blockquote:border-l-4 prose-blockquote:border-[#0070F0] prose-blockquote:bg-blue-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700
                prose-a:text-blue-600 prose-a:underline prose-a:font-bold hover:prose-a:text-blue-800
                prose-li:marker:text-gray-400 prose-li:mb-1
                bg-white cursor-text"
                contentEditable
                onInput={handleInput}
                onDrop={handleDrop}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                spellCheck={false}
                dangerouslySetInnerHTML={{ __html: value }}
                placeholder="내용을 입력하세요... (이미지는 드래그 앤 드롭 가능)"
            />
            <div className="bg-gray-50 text-right px-4 py-2 text-[10px] text-gray-400 font-mono border-t border-gray-100">
                HTML Mode Supported
            </div>
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, label }: any) => (
    <button type="button" onClick={onClick} title={label} className="p-1.5 text-gray-500 hover:text-[#0070F0] hover:bg-blue-50 rounded transition-colors">{icon}</button>
);
