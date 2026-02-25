import React from 'react';
import { COMPANY_INFO, COMPANY_INFO_EN } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';

interface FooterProps {
  language: 'ko' | 'en' | 'ja' | 'zh';
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const { t } = useGlobal();
  const isKo = language === 'ko';
  const info = isKo ? COMPANY_INFO : COMPANY_INFO_EN;

  const labels: Record<string, Record<string, string>> = {
    ko: { about: '회사소개', terms: '이용약관', privacy: '개인정보처리방침', guide: '이용안내', store_info: '쇼핑몰 기본정보', company_name: '상호명', ceo: '대표자명', address: '사업장 주소', phone_label: '대표 전화', biz_reg: '사업자 등록번호', telecom: '통신판매업 신고번호', foreign_patient: '외국인환자 유치업자 등록증', tourism: '관광사업등록증', privacy_officer: '개인정보보호책임자', cs_info: '고객센터 정보', cs_phone: '상담/주문 전화', cs_email: '상담/주문 이메일', cs_hours: 'CS운영시간', bank_info: '결제정보', bank_account: '무통장 계좌정보' },
    en: { about: 'About Us', terms: 'Terms of Service', privacy: 'Privacy Policy', guide: 'Shopping Guide', store_info: 'Store Information', company_name: 'Company Name', ceo: 'CEO Name', address: 'Business Address', phone_label: 'Main Phone', biz_reg: 'Business Registration No.', telecom: 'Mail Order Business Registration No.', foreign_patient: 'Foreign Patient Attraction Agency Registration No.', tourism: 'Tourism Business Registration No.', privacy_officer: 'Chief Privacy Officer', cs_info: 'Customer Service', cs_phone: 'Phone', cs_email: 'Email', cs_hours: 'Service Hours', bank_info: 'Payment Info', bank_account: 'Bank Account' },
    ja: { about: '会社概要', terms: '利用規約', privacy: 'プライバシーポリシー', guide: 'ご利用ガイド', store_info: 'ショップ情報', company_name: '会社名', ceo: '代表者名', address: '所在地', phone_label: '代表電話', biz_reg: '事業者登録番号', telecom: '通信販売業届出番号', foreign_patient: '外国人患者誘致事業者登録証', tourism: '観光事業登録証', privacy_officer: '個人情報保護責任者', cs_info: 'カスタマーサポート', cs_phone: 'お電話', cs_email: 'メール', cs_hours: '営業時間', bank_info: 'お支払い情報', bank_account: '口座情報' },
    zh: { about: '关于我们', terms: '服务条款', privacy: '隐私政策', guide: '使用指南', store_info: '商店信息', company_name: '公司名称', ceo: '代表人', address: '地址', phone_label: '电话', biz_reg: '营业执照号', telecom: '通讯销售业申报号', foreign_patient: '外国患者招揽业者登记证', tourism: '旅游业登记证', privacy_officer: '隐私保护负责人', cs_info: '客服中心', cs_phone: '电话', cs_email: '邮箱', cs_hours: '服务时间', bank_info: '支付信息', bank_account: '银行账户' }
  };

  const l = labels[language] || labels.en;

  return (
    <footer className="bg-[#fcfcfc] border-t border-gray-100 pt-16 pb-20 text-[12px] text-[#666] font-sans tracking-tight">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        
        <div className="mb-10">
             <img 
                src="//ecimg.cafe24img.com/pg2441b44963288024/samsongenm1/web/upload/category/logo/v2_eeb789877378fab1385e25cce7da0111_BsEVO0UwOn_bottom.jpg" 
                alt="K-Experience" 
                className="h-7 object-contain"
            />
        </div>

        <div className="flex flex-wrap gap-8 mb-16 text-[13px] font-medium">
             <a href="#" className="hover:text-black transition-colors">{l.about}</a>
             <a href="#" className="hover:text-black transition-colors">{l.terms}</a>
             <a href="#" className="hover:text-black font-bold text-[#333] transition-colors">{l.privacy}</a>
             <a href="#" className="hover:text-black transition-colors">{l.guide}</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-32 mb-16">
            <div className="space-y-4">
                <h3 className="font-bold text-[13px] text-[#111] mb-2">{l.store_info}</h3>
                <div className="flex flex-col gap-2 leading-relaxed text-[#777]">
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{l.company_name}</span> {info.name} 
                        <span className="font-bold ml-3 mr-1 text-[#444]">{l.ceo}</span> {info.president}
                    </div>
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{l.address}</span> {info.address}
                        {isKo && <><span className="font-bold ml-3 mr-1 text-[#444]">{l.phone_label}</span> {info.phone}</>}
                    </div>
                    <div><span className="font-bold mr-1 text-[#444]">{isKo ? l.biz_reg : l.phone_label}</span> {isKo ? info.regNo : info.phone}</div>
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{isKo ? l.telecom : l.biz_reg}</span> {isKo ? info.telecomNo : info.regNo}
                        {isKo && <a href="#" className="underline text-[#999] ml-1">[사업자정보확인]</a>}
                    </div>
                    <div>
                        <span className="font-bold mr-1 text-[#444]">{l.foreign_patient}</span> A-2025-01-01-06352
                        {isKo && <><span className="font-bold ml-3 mr-1 text-[#444]">{l.tourism}</span> 2025-08</>}
                    </div>
                    {!isKo && <div><span className="font-bold mr-1 text-[#444]">{l.telecom}</span> {info.telecomNo}</div>}
                    {!isKo && <div><span className="font-bold mr-1 text-[#444]">{l.tourism}</span> 2025-08</div>}
                    <div><span className="font-bold mr-1 text-[#444]">{l.privacy_officer}</span> {isKo ? '삼송이앤엠홀딩스' : 'SAMSONG E&M Holdings Co., Ltd'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <h3 className="font-bold text-[13px] text-[#111] mb-2">{l.cs_info}</h3>
                    <div className="flex flex-col gap-2 leading-relaxed text-[#777]">
                        <div><span className="font-bold mr-1 text-[#444]">{l.cs_phone}</span> {info.phone}</div>
                        <div><span className="font-bold mr-1 text-[#444]">{l.cs_email}</span></div>
                        <div className="text-[#444] font-medium">{info.email}</div>
                        <div className="mt-2">
                            <span className="font-bold block mb-1 text-[#444]">{l.cs_hours}</span> 10:00~19:00
                        </div>
                    </div>
                 </div>

                 {isKo && (
                     <div className="space-y-4">
                        <h3 className="font-bold text-[13px] text-[#111] mb-2">{l.bank_info}</h3>
                        <div className="flex flex-col gap-2 leading-relaxed text-[#777]">
                            <div className="font-bold mb-1 text-[#444]">{l.bank_account}</div>
                            <div>기업은행 <span className="ml-2 font-medium text-[#333]">592-033904-04-021</span></div>
                            <div>주식회사 삼송이앤엠홀딩스</div>
                        </div>
                     </div>
                 )}
            </div>
        </div>

        <div className="border-t border-gray-100 pt-10 text-[#BBB] text-[11px] font-light tracking-normal">
            {t('copyright')} Hosting by Cafe24 Corp.
        </div>
      </div>
    </footer>
  );
};
