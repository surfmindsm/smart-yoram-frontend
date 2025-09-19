import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">개인정보처리방침</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <section>
            <h3 className="text-lg font-semibold mb-3">제1조 (개인정보의 처리목적)</h3>
            <div className="space-y-2 text-gray-700">
              <p>스마트 요람(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>서비스 제공 및 계약이행</li>
                <li>회원가입 의사 확인, 회원 식별, 회원탈퇴 의사 확인</li>
                <li>교회 관리 시스템 서비스 제공</li>
                <li>커뮤니티 매칭 서비스 제공</li>
                <li>고객 상담 및 문의사항 처리</li>
                <li>서비스 개선 및 신규 서비스 개발</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제2조 (처리하는 개인정보 항목)</h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-medium">1. 필수항목</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>이메일 주소</li>
                  <li>비밀번호</li>
                  <li>단체/회사명</li>
                  <li>담당자명</li>
                  <li>연락처</li>
                  <li>신청자 유형</li>
                  <li>서비스 이용 목적</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">2. 선택항목</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>사업자등록번호</li>
                  <li>주소</li>
                  <li>서비스 지역</li>
                  <li>웹사이트</li>
                  <li>첨부파일</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제3조 (개인정보의 처리 및 보유기간)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 개인정보 수집·이용 목적 달성 시까지 개인정보를 처리합니다.</p>
              <p>2. 구체적인 개인정보 처리 및 보유기간은 다음과 같습니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>회원정보: 회원탈퇴 시까지 (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간)</li>
                <li>서비스 이용기록: 3년</li>
                <li>고객 상담 기록: 3년</li>
                <li>부정이용 관련 기록: 1년</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다.</p>
              <p>2. 다만, 다음의 경우에는 예외로 합니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>정보주체가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                <li>커뮤니티 매칭 서비스 제공을 위해 필요한 최소한의 정보 (이름, 연락처, 서비스 내용)</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제5조 (개인정보처리의 위탁)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 서비스 향상을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>클라우드 서비스 제공업체: 데이터 저장 및 관리</li>
                <li>이메일 발송 서비스: 알림 및 공지사항 발송</li>
              </ul>
              <p>2. 위탁계약 체결 시 개인정보보호법에 따라 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 정보주체는 회사에 대해 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>개인정보 처리현황 통지 요구</li>
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
              </ul>
              <p>2. 권리 행사는 개인정보보호법 시행령에 따라 서면, 전화, 전자우편, 모사전송 등을 통하여 하실 수 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제7조 (개인정보의 안전성 확보조치)</h3>
            <div className="space-y-2 text-gray-700">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 암호화</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제8조 (개인정보보호책임자)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 개인정보보호책임자를 지정하고 있습니다.</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">개인정보보호책임자</p>
                <p>이름: 개인정보보호담당자</p>
                <p>연락처: privacy@smartyoram.com</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제9조 (개인정보처리방침 변경)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
              <p>2. 본 방침은 2025년 9월 9일부터 시행됩니다.</p>
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;