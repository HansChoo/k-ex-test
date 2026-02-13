
import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Image as ImageIcon, Youtube, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Type, Loader2 } from 'lucide-react';
import { uploadImage } from '../services/imageService';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            if (editorRef.current.innerHTML === '' || value === '') {
                 editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    // Handle Drag & Drop Image Upload
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0] as File;
            if (file.type.startsWith('image/')) {
                setIsUploading(true);
                try {
                    const url = await uploadImage(file, 'editor_uploads');
                    execCommand('insertImage', url);
                    handleInput();
                } catch (error) {
                    alert("이미지 업로드 실패");
                } finally {
                    setIsUploading(false);
                }
            }
        }
    };

    const addYoutube = () => {
        const url = prompt("유튜브 영상 링크를 입력하세요:");
        if (url) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (match && match[1]) {
                const embedHtml = `<div class="video-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:20px 0;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`;
                execCommand('insertHTML', embedHtml);
                handleInput();
            } else {
                alert("올바른 유튜브 링크가 아닙니다.");
            }
        }
    };

    const addImageByUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setIsUploading(true);
                try {
                    const url = await uploadImage(file, 'editor_uploads');
                    execCommand('insertImage', url);
                    handleInput();
                } catch (error) {
                    alert("업로드 실패");
                } finally {
                    setIsUploading(false);
                }
            }
        };
        input.click();
    };

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
            selectedImage.style.height = 'auto';
            handleInput();
            setSelectedImage(null);
        }
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col h-[600px] relative">
            {isUploading && (
                <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                    <span className="font-bold text-gray-600">이미지 업로드 중...</span>
                </div>
            )}
            
            {/* Toolbar - Sticky */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-[#f8f9fa] border-b border-gray-300 sticky top-0 z-10">
                <ToolbarButton icon={<Bold size={16}/>} onClick={() => execCommand('bold')} label="굵게" />
                <ToolbarButton icon={<Italic size={16}/>} onClick={() => execCommand('italic')} label="기울임" />
                <ToolbarButton icon={<Underline size={16}/>} onClick={() => execCommand('underline')} label="밑줄" />
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<Heading1 size={16}/>} onClick={() => execCommand('formatBlock', 'H2')} label="제목 1" />
                <ToolbarButton icon={<Heading2 size={16}/>} onClick={() => execCommand('formatBlock', 'H3')} label="제목 2" />
                <ToolbarButton icon={<Type size={16}/>} onClick={() => execCommand('formatBlock', 'P')} label="본문" />
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<AlignLeft size={16}/>} onClick={() => execCommand('justifyLeft')} label="왼쪽 정렬" />
                <ToolbarButton icon={<AlignCenter size={16}/>} onClick={() => execCommand('justifyCenter')} label="가운데 정렬" />
                <ToolbarButton icon={<AlignRight size={16}/>} onClick={() => execCommand('justifyRight')} label="오른쪽 정렬" />
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<List size={16}/>} onClick={() => execCommand('insertUnorderedList')} label="글머리 기호" />
                <ToolbarButton icon={<ListOrdered size={16}/>} onClick={() => execCommand('insertOrderedList')} label="번호 매기기" />
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <ToolbarButton icon={<LinkIcon size={16}/>} onClick={() => { const url=prompt('링크 URL:'); if(url) execCommand('createLink', url); }} label="링크" />
                <ToolbarButton icon={<ImageIcon size={16}/>} onClick={addImageByUpload} label="사진 업로드" />
                <ToolbarButton icon={<Youtube size={16}/>} onClick={addYoutube} label="동영상" />
            </div>

            {/* Resize Overlay */}
            {selectedImage && (
                <div className="absolute z-20 bg-black/80 text-white px-3 py-2 rounded-lg flex gap-2 items-center left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl animate-fade-in">
                    <span className="text-xs font-bold mr-2">크기 조절:</span>
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
                className="flex-1 overflow-y-auto p-8 focus:outline-none prose max-w-none prose-img:rounded-xl prose-img:shadow-sm"
                contentEditable
                onInput={handleInput}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={handleEditorClick}
                spellCheck={false}
                style={{ minHeight: '300px' }}
                dangerouslySetInnerHTML={{ __html: value }}
            />
            <div className="bg-gray-50 p-2 text-xs text-center text-gray-400 border-t border-gray-200">
                Tip: 이미지를 드래그하여 본문에 바로 추가할 수 있습니다.
            </div>
        </div>
    );
};

const ToolbarButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label?: string }) => (
    <button 
        type="button"
        onClick={onClick} 
        title={label}
        className="p-2 hover:bg-white hover:text-blue-600 rounded transition-all text-gray-600"
    >
        {icon}
    </button>
);
