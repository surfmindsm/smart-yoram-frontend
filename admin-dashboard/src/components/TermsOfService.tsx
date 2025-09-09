import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const TermsOfService: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">스마트 요람 서비스 이용약관</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <section>
            <h3 className="text-lg font-semibold mb-3">제1조 (목적)</h3>
            <p className="text-gray-700 leading-7">
              본 약관은 스마트 요람(이하 "회사")이 제공하는 교회 관리 및 커뮤니티 서비스(이하 "서비스")의 
              이용과 관련하여 회사와 이용자 간의 권리와 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제2조 (정의)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. "서비스"라 함은 회사가 제공하는 교회 관리 시스템 및 관련 커뮤니티 서비스를 의미합니다.</p>
              <p>2. "이용자"라 함은 본 약관에 따라 회사가 제공하는 서비스를 받는 개인 또는 법인을 의미합니다.</p>
              <p>3. "계정"이라 함은 서비스 이용을 위해 이용자가 등록한 고유 식별정보를 의미합니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 본 약관은 서비스를 신청한 고객이 본 약관에 동의하고 회사가 이를 승인함으로써 효력이 발생합니다.</p>
              <p>2. 회사는 필요에 따라 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</p>
              <p>3. 약관이 변경될 경우, 변경된 약관은 서비스 내 공지사항을 통해 공지됩니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제4조 (서비스의 제공 및 변경)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>교회 회원 관리 시스템</li>
                <li>출석 관리 및 통계</li>
                <li>공지사항 및 게시판 관리</li>
                <li>커뮤니티 매칭 서비스 (업체, 개인, 연주팀, 사역자 등)</li>
                <li>기타 교회 운영에 필요한 부가 서비스</li>
              </ul>
              <p>2. 회사는 서비스의 품질 향상을 위해 서비스의 내용을 추가, 변경, 삭제할 수 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제5조 (이용자의 의무)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 이용자는 다음 행위를 해서는 안 됩니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>타인의 정보 도용 또는 허위 정보 등록</li>
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>다른 이용자의 개인정보 수집, 저장, 공개</li>
                <li>음란, 폭력적, 반사회적 내용의 정보 게시</li>
                <li>종교적 갈등을 조장하는 내용의 게시</li>
              </ul>
              <p>2. 이용자는 자신의 계정 정보에 대한 관리 책임을 집니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제6조 (개인정보 보호)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 이용자의 개인정보를 관련 법령에 따라 보호합니다.</p>
              <p>2. 개인정보의 처리에 관한 자세한 내용은 별도의 개인정보처리방침에서 정합니다.</p>
              <p>3. 이용자는 언제든지 자신의 개인정보 처리 현황을 확인하고 수정을 요구할 수 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제7조 (서비스 이용제한)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 다음의 경우 서비스 이용을 제한할 수 있습니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>본 약관을 위반한 경우</li>
                <li>서비스의 정상적인 이용을 방해한 경우</li>
                <li>관련 법령을 위반한 경우</li>
              </ul>
              <p>2. 서비스 이용제한에 대한 이의가 있는 경우, 이용자는 회사에 이의신청을 할 수 있습니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제8조 (면책조항)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 회사는 천재지변, 전쟁, 파업 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</p>
              <p>2. 회사는 이용자간의 거래나 분쟁에 대해 개입하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.</p>
              <p>3. 이용자가 서비스를 이용하여 얻은 정보에 의한 손해에 대해서는 이용자가 책임을 집니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">제9조 (분쟁 해결)</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 본 약관과 관련된 분쟁은 대한민국 법령에 따라 해결됩니다.</p>
              <p>2. 서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사 소재지를 관할하는 법원을 관할 법원으로 합니다.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">부칙</h3>
            <div className="space-y-2 text-gray-700">
              <p>1. 본 약관은 2025년 9월 9일부터 적용됩니다.</p>
              <p>2. 본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</p>
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;