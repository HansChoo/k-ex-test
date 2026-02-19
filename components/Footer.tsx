import React from 'react';
import { COMPANY_INFO, COMPANY_INFO_EN } from '../constants';

interface FooterProps {
  language: 'ko' | 'en' | 'ja' | 'zh';
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const isEn = language === 'en';
  const info = isEn ? COMPANY_INFO_EN : COMPANY_INFO;

  return (
    <footer className="bg-[#fcfcfc] border-t border-gray-100 pt-16 pb-20 text-[12px] text-[#666] font-sans tracking-tight">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        
        {/* Logo */}
        <div className="mb-10">
             <img 
                src="//ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/category/logo/v2_eeb789877378fab1385e25cce7da0111_BsEVO0UwOn_bottom.jpg" 
                alt="K-Experience" 
                className="h-7 object-contain"
            />
        </div>

        {/* Links Row */}
        <div className="flex flex-wrap gap-8 mb-16 text-[13px] font-medium">
             <a href="#" className="hover:text-black transition-colors">{isEn ? 'About Us' : '회사소개'}</a>
             <a href="#" className="hover:text-black transition-colors">{isEn ? 'Terms of Service' : '이용약관'}</a>
             <a href="#" className="hover:text-black font-bold text-[#333] transition-colors">{isEn ? 'Privacy Policy' : '개인정보처리방침'}</a>
             <a href="#" className="hover:text-black transition-colors">{isEn ? 'Shopping Guide' : '이용안내'}</a>
        </div>

        {/* Info Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-32 mb-16">
            {/* Left Col: Shop Info */}
            <div className="space-y-4">
                <h3 className="font-bold text-[13px] text-[#111] mb-2">{isEn ? 'Store Information' : '쇼핑몰 기본정보'}</h3>
                <div className="flex flex-col gap-2 leading-relaxed text-[#777]">
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{isEn ? 'Company Name' : '상호명'}</span> {info.name} 
                        <span className="font-bold ml-3 mr-1 text-[#444]">{isEn ? 'CEO Name' : '대표자명'}</span> {info.president}
                    </div>
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{isEn ? 'Business Address' : '사업장 주소'}</span> {info.address} 
                        {isEn ? null : <><span className="font-bold ml-3 mr-1 text-[#444]">대표 전화</span> {info.phone}</>}
                    </div>
                    <div><span className="font-bold mr-1 text-[#444]">{isEn ? 'Main Phone Number' : '사업자 등록번호'}</span> {isEn ? info.phone : info.regNo}</div>
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{isEn ? 'Business Registration Number' : '통신판매업 신고번호'}</span> {isEn ? info.regNo : info.telecomNo} 
                        {!isEn && <a href="#" className="underline text-[#999] ml-1">[사업자정보확인]</a>}
                    </div>
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{isEn ? 'Mail Order Business Registration Number' : '외국인환자 유치업자 등록증'}</span> 
                        {isEn ? info.telecomNo : 'A-2025-01-01-06352'} 
                        {!isEn && <><span className="font-bold ml-3 mr-1 text-[#444]">관광사업등록증</span> 2025-08</>}
                    </div>
                    {isEn && (
                        <>
                            <div><span className="font-bold mr-1 text-[#444]">Foreign Patient Attraction Agency Registration No.</span> A-2025-01-01-06352</div>
                            <div><span className="font-bold mr-1 text-[#444]">Tourism Business Registration No.</span> 2025-08</div>
                            <div><span className="font-bold mr-1 text-[#444]">Chief Privacy Officer</span> SAMSONG E&M Holdings Co., Ltd</div>
                        </>
                    )}
                    {!isEn && <div><span className="font-bold mr-1 text-[#444]">개인정보보호책임자</span> 삼송이앤엠홀딩스</div>}
                </div>
            </div>

            {/* Right Col: CS & Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                 {/* CS */}
                 <div className="space-y-4">
                    <h3 className="font-bold text-[13px] text-[#111] mb-2">{isEn ? 'Customer Service Information' : '고객센터 정보'}</h3>
                    <div className="flex flex-col gap-2 leading-relaxed text-[#777]">
                        <div><span className="font-bold mr-1 text-[#444]">{isEn ? 'Customer Support/Order Phone' : '상담/주문 전화'}</span> {info.phone}</div>
                        <div><span className="font-bold mr-1 text-[#444]">{isEn ? 'Customer Support/Order Email' : '상담/주문 이메일'}</span></div>
                        <div className="text-[#444] font-medium">{info.email}</div>
                        <div className="mt-2">
                            <span className="font-bold block mb-1 text-[#444]">{isEn ? 'Customer Service Hours' : 'CS운영시간'}</span> 10:00~19:00
                        </div>
                    </div>
                 </div>

                 {/* Bank (Hide in EN as per common practice or keep simplified) */}
                 {!isEn && (
                     <div className="space-y-4">
                        <h3 className="font-bold text-[13px] text-[#111] mb-2">결제정보</h3>
                        <div className="flex flex-col gap-2 leading-relaxed text-[#777]">
                            <div className="font-bold mb-1 text-[#444]">무통장 계좌정보</div>
                            <div>기업은행 <span className="ml-2 font-medium text-[#333]">592-033904-04-021</span></div>
                            <div>주식회사 삼송이앤엠홀딩스</div>
                        </div>
                     </div>
                 )}
            </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-100 pt-10 text-[#BBB] text-[11px] font-light tracking-normal">
            Copyright © K-experience. All Rights Reserved. Hosting by Cafe24 Corp.
        </div>
      </div>
    </footer>
  );
};