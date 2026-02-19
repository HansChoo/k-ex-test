
import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebaseConfig';
import { uploadImage } from '../services/imageService';
import { CheckCircle, Upload, ChevronRight, AlertCircle, Camera, Music, HeartPulse, Sparkles } from 'lucide-react';

interface SurveyPageProps { language: 'ko' | 'en' | 'ja' | 'zh'; }

export const SurveyPage: React.FC<SurveyPageProps> = ({ language }) => {
    const isEn = language !== 'ko';
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [reservation, setReservation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Dynamic Form State
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setReservationId(id);
            fetchReservation(id);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchReservation = async (id: string) => {
        if (!db) { setLoading(false); return; }
        try {
            const docRef = doc(db, "reservations", id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setReservation(data);
                if (data.surveyAnswers) {
                    setSubmitted(true); // Already answered
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await uploadImage(e.target.files[0], 'survey_uploads');
                setFormData({ ...formData, [field]: url });
            } catch (err) {
                alert("Upload failed");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reservationId) return;

        try {
            if (!db) return;
            await updateDoc(doc(db, "reservations", reservationId), {
                surveyAnswers: formData,
                surveySubmittedAt: serverTimestamp()
            });
            setSubmitted(true);
        } catch (error) {
            alert("Error submitting survey.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!reservationId || !reservation) return <div className="min-h-screen flex items-center justify-center flex-col"><AlertCircle className="text-red-500 mb-2" size={48}/><p>Invalid Reservation Link</p></div>;
    if (submitted) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">{isEn ? "Survey Completed" : "문진표 작성 완료"}</h2>
                <p className="text-gray-500 mb-6">{isEn ? "Thank you! We will prepare for your visit." : "감사합니다! 방문 전 꼼꼼히 준비해두겠습니다."}</p>
                <button onClick={() => window.location.href='/'} className="bg-black text-white px-6 py-3 rounded-lg font-bold w-full">Go Home</button>
            </div>
        </div>
    );

    // Determine Category Logic (Can be improved with explicit category field in DB)
    const isMedical = reservation.productName.includes('건강') || reservation.productName.includes('Health') || reservation.options?.category?.includes('Health');
    const isIdol = reservation.productName.includes('IDOL') || reservation.options?.category?.includes('IDOL');
    const isBeauty = !isMedical && !isIdol; // Default fallback to beauty

    return (
        <div className="min-h-screen bg-[#F4F6F8] py-10 px-4 font-sans">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                    <div className={`p-6 text-white ${isMedical ? 'bg-teal-500' : isIdol ? 'bg-purple-600' : 'bg-rose-500'}`}>
                        <div className="flex items-center gap-2 mb-2 opacity-90 text-sm font-bold uppercase tracking-wider">
                            {isMedical ? <HeartPulse size={16}/> : isIdol ? <Music size={16}/> : <Sparkles size={16}/>}
                            PRE-VISIT SURVEY
                        </div>
                        <h1 className="text-2xl font-black mb-1">{reservation.productName}</h1>
                        <p className="opacity-80 text-sm">{reservation.date} • {reservation.peopleCount} Person(s)</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* MEDICAL FORM */}
                        {isMedical && (
                            <>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">1. 현재 복용중인 약물이 있나요?</label>
                                    <textarea className="w-full border p-3 rounded-lg h-24" placeholder="없음 / 고혈압약, 당뇨약 등" onChange={e => handleInputChange('medication', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">2. 과거 수술 이력이나 알레르기가 있나요?</label>
                                    <textarea className="w-full border p-3 rounded-lg h-24" placeholder="없음 / 페니실린 알레르기 등" onChange={e => handleInputChange('allergy', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">3. 특별히 우려되는 건강 문제가 있나요?</label>
                                    <input className="w-full border p-3 rounded-lg" placeholder="예: 잦은 두통, 소화불량" onChange={e => handleInputChange('concern', e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* IDOL FORM */}
                        {isIdol && (
                            <>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">1. 뮤직비디오 촬영 희망곡 (YouTube Link)</label>
                                    <input className="w-full border p-3 rounded-lg" placeholder="https://youtube.com/..." onChange={e => handleInputChange('songUrl', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">2. 선호하는 의상/메이크업 스타일 (사진 첨부)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
                                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'referenceImage')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            {formData.referenceImage ? (
                                                <img src={formData.referenceImage} className="h-32 object-contain rounded" />
                                            ) : (
                                                <><Camera size={32} /><span>Click to Upload Reference Photo</span></>
                                            )}
                                        </div>
                                    </div>
                                    {uploading && <p className="text-sm text-blue-500 mt-2">Uploading...</p>}
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">3. 좋아하는 K-POP 아이돌은?</label>
                                    <input className="w-full border p-3 rounded-lg" placeholder="BTS, Blackpink, NewJeans..." onChange={e => handleInputChange('bias', e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* BEAUTY FORM */}
                        {isBeauty && (
                            <>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">1. 가장 큰 피부 고민은 무엇인가요?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['여드름/트러블', '주름/탄력', '기미/잡티', '건조함', '모공'].map(opt => (
                                            <label key={opt} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" onChange={e => {
                                                    const current = formData.skinConcerns || [];
                                                    const updated = e.target.checked ? [...current, opt] : current.filter((x:string) => x !== opt);
                                                    setFormData({...formData, skinConcerns: updated});
                                                }} /> {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">2. 최근 6개월 내 받은 시술이 있나요?</label>
                                    <input className="w-full border p-3 rounded-lg" placeholder="없음 / 보톡스, 필러 등" onChange={e => handleInputChange('history', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">3. 현재 얼굴 사진 (정면)</label>
                                    <p className="text-xs text-gray-400 mb-2">* 정확한 상담을 위해 민낯 사진을 권장합니다.</p>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'facePhoto')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        {formData.facePhoto ? <span className="text-green-600 font-bold">Photo Uploaded!</span> : <span className="text-gray-400">Upload Photo</span>}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="pt-6 border-t border-gray-100">
                            <button type="submit" disabled={uploading} className="w-full bg-[#111] text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-colors shadow-lg flex items-center justify-center gap-2">
                                {isEn ? "Submit Survey" : "문진표 제출하기"} <ChevronRight size={18}/>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
