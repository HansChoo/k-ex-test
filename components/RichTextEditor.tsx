import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Image as ImageIcon, Youtube, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

    // Initial Value Sync
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only set if significantly different to avoid cursor jumps, 
            // but for simple implementation we just set it if empty or strictly needed.
            if (editorRef.current.innerHTML === '' || value === '') {
                 editorRef.current.innerHTML = value;
            }
        }
    }, []); // Run once on mount mostly, or handle carefully

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0] as File;
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        execCommand('insertImage', event.target.result as string);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const addYoutube = () => {
        const url = prompt("Enter YouTube URL:");
        if (url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (match && match[1]) {
                const embedHtml = `<div class="video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-bottom:20px;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:12px;" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`;
                execCommand('insertHTML', embedHtml);
            } else {
                alert("Invalid YouTube URL");
            }
        }
    };

    const addImageByUrl = () => {
        const url = prompt("Enter Image URL:");
        if (url) execCommand('insertImage', url);
    };

    // Image Resizing Logic
    const handleEditorClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
            setSelectedImage(target as HTMLImageElement);
        } else {
            setSelectedImage(null);
        }
    };

    const resizeImage = (widthPercent: string) => {
        if (selectedImage) {
            selectedImage.style.width = widthPercent;
            selectedImage.style.height = 'auto'; // Maintain aspect ratio
            handleInput(); // Trigger change
            setSelectedImage(null); // Deselect
        }
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-[600px]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
                <ToolbarButton icon={<Bold size={18}/>} onClick={() => execCommand('bold')} label="Bold" />
                <ToolbarButton icon={<Italic size={18}/>} onClick={() => execCommand('italic')} label="Italic" />
                <ToolbarButton icon={<Underline size={18}/>} onClick={() => execCommand('underline')} label="Underline" />
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<Heading1 size={18}/>} onClick={() => execCommand('formatBlock', 'H2')} label="H1" />
                <ToolbarButton icon={<Heading2 size={18}/>} onClick={() => execCommand('formatBlock', 'H3')} label="H2" />
                <ToolbarButton icon={<Type size={18}/>} onClick={() => execCommand('formatBlock', 'P')} label="Paragraph" />
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<List size={18}/>} onClick={() => execCommand('insertUnorderedList')} label="Bullet List" />
                <ToolbarButton icon={<ListOrdered size={18}/>} onClick={() => execCommand('insertOrderedList')} label="Number List" />
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<AlignLeft size={18}/>} onClick={() => execCommand('justifyLeft')} label="Left" />
                <ToolbarButton icon={<AlignCenter size={18}/>} onClick={() => execCommand('justifyCenter')} label="Center" />
                <ToolbarButton icon={<AlignRight size={18}/>} onClick={() => execCommand('justifyRight')} label="Right" />
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<LinkIcon size={18}/>} onClick={() => { const url=prompt('URL:'); if(url) execCommand('createLink', url); }} label="Link" />
                <ToolbarButton icon={<ImageIcon size={18}/>} onClick={addImageByUrl} label="Image URL" />
                <ToolbarButton icon={<Youtube size={18}/>} onClick={addYoutube} label="YouTube" />
            </div>

            {/* Resize Overlay */}
            {selectedImage && (
                <div className="absolute z-10 bg-black/80 text-white px-3 py-2 rounded-lg flex gap-2 items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl animate-fade-in">
                    <span className="text-xs font-bold mr-2">Resize:</span>
                    <button onClick={() => resizeImage('25%')} className="hover:text-blue-400 text-xs font-bold">25%</button>
                    <button onClick={() => resizeImage('50%')} className="hover:text-blue-400 text-xs font-bold">50%</button>
                    <button onClick={() => resizeImage('75%')} className="hover:text-blue-400 text-xs font-bold">75%</button>
                    <button onClick={() => resizeImage('100%')} className="hover:text-blue-400 text-xs font-bold">100%</button>
                    <button onClick={() => setSelectedImage(null)} className="ml-2 text-gray-400 hover:text-white">✕</button>
                </div>
            )}

            {/* Content Area */}
            <div 
                ref={editorRef}
                className="flex-1 overflow-y-auto p-6 focus:outline-none prose max-w-none"
                contentEditable
                onInput={handleInput}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={handleEditorClick}
                style={{ minHeight: '300px' }}
                dangerouslySetInnerHTML={{ __html: value }}
            />
            <div className="bg-gray-50 p-2 text-xs text-center text-gray-400 border-t border-gray-100">
                Tip: Drag & Drop images directly into the editor. Click an image to resize.
            </div>
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label?: string }) => (
    <button 
        type="button"
        onClick={onClick} 
        title={label}
        className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
    >
        {icon}
    </button>
);