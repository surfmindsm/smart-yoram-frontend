# 위치 선택 기능 명세서

## 개요
무료나눔, 물품판매 등 커뮤니티 기능에서 사용되는 **2단계 위치 선택 시스템** 명세서입니다.

## 위치 선택 구조

### 1단계: 도/시 선택
- 서울특별시
- 부산광역시
- 대구광역시
- 인천광역시
- 광주광역시
- 대전광역시
- 울산광역시
- 세종특별자치시
- 경기도
- 강원도
- 충청북도
- 충청남도
- 전라북도
- 전라남도
- 경상북도
- 경상남도
- 제주특별자치도

### 2단계: 시/군/구 선택
도/시 선택에 따라 해당하는 시/군/구 목록이 표시됩니다.

#### 예시: 서울특별시 선택 시
- 강남구, 강동구, 강북구, 강서구, 관악구, 광진구, 구로구, 금천구, 노원구, 도봉구, 동대문구, 동작구, 마포구, 서대문구, 서초구, 성동구, 성북구, 송파구, 양천구, 영등포구, 용산구, 은평구, 종로구, 중구, 중랑구

#### 예시: 경기도 선택 시
- 수원시, 성남시, 용인시, 고양시, 안양시, 안산시, 부천시, 광명시, 평택시, 과천시, 오산시, 시흥시, 군포시, 의왕시, 하남시, 남양주시, 구리시, 의정부시, 양주시, 동두천시, 파주시, 포천시, 연천군, 김포시, 화성시, 광주시, 이천시, 여주시, 양평군, 가평군, 안성시

#### 예시: 제주특별자치도 선택 시
- 제주시, 서귀포시

## UI 구현 사항

### 위치 선택 UI
```
[도/시 선택 드롭다운] [시/군/구 선택 드롭다운]
```

**레이아웃:**
- 두 드롭다운을 가로로 나란히 배치
- 첫 번째 드롭다운 우측에 약간의 패딩 (8px 권장)
- 드롭다운 최대 높이: 240px (스크롤 가능)

**동작:**
1. 도/시 선택 → 시/군/구 드롭다운 활성화
2. 도/시 변경 → 시/군/구 초기화
3. 시/군/구는 도/시 미선택 시 비활성화

### 위치 필터 UI (목록 화면)
```
[카테고리] [상태] [전체 도/시] [전체 구]
```

**필터 옵션:**
- 도/시: "전체 도/시" + 17개 도/시
- 구: "전체 구" + 선택된 도/시의 구 목록
- 구 필터는 도/시 선택 시에만 활성화

**필터링 로직:**
- 도/시 필터: 위치 문자열이 선택된 도/시로 시작하는지 확인
- 구 필터: 도/시가 선택된 상태에서 위치 문자열에 선택된 구가 포함되는지 확인

## 데이터 형식

### 저장 형식
```
"{도/시} {시/군/구}"
```

**예시:**
- "서울특별시 강남구"
- "경기도 성남시"
- "제주특별자치도 제주시"

### API 요청 시
```json
{
  "location": "서울특별시 강남구"
}
```

### API 응답 시
```json
{
  "location": "서울특별시 강남구"
}
```

## 전체 위치 데이터

### 광역시/특별시 (구 단위 상세)
- **서울특별시**: 25개 구
- **부산광역시**: 16개 구/군
- **대구광역시**: 8개 구/군
- **인천광역시**: 10개 구/군
- **광주광역시**: 5개 구
- **대전광역시**: 5개 구
- **울산광역시**: 5개 구/군
- **세종특별자치시**: 1개 (세종시)

### 도 단위 (시/군 목록)
- **경기도**: 31개 시/군
- **강원도**: 18개 시/군
- **충청북도**: 11개 시/군
- **충청남도**: 15개 시/군
- **전라북도**: 14개 시/군
- **전라남도**: 22개 시/군
- **경상북도**: 23개 시/군
- **경상남도**: 18개 시/군
- **제주특별자치도**: 2개 시

## 참고사항

1. **동/읍/면 데이터는 제공하지 않음**: 관리 복잡도를 줄이기 위해 도/시 - 시/군/구 2단계만 제공
2. **상세주소**: 필요시 별도 텍스트 입력 필드로 처리
3. **검색**: 위치 문자열 전체를 대상으로 부분 검색 가능
4. **정렬**: 가나다순 정렬 권장

## 구현 예시 (Flutter/React Native)

### 위치 선택 위젯
```dart
// Flutter 예시
class LocationSelector extends StatefulWidget {
  final Function(String) onLocationChanged;

  @override
  _LocationSelectorState createState() => _LocationSelectorState();
}

class _LocationSelectorState extends State<LocationSelector> {
  String? selectedCity;
  String? selectedDistrict;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: DropdownButton<String>(
            hint: Text('도/시 선택'),
            value: selectedCity,
            items: cities.map((city) => DropdownMenuItem(
              value: city,
              child: Text(city),
            )).toList(),
            onChanged: (value) {
              setState(() {
                selectedCity = value;
                selectedDistrict = null;
                widget.onLocationChanged(value ?? '');
              });
            },
          ),
        ),
        SizedBox(width: 8),
        Expanded(
          child: DropdownButton<String>(
            hint: Text('시/군/구 선택'),
            value: selectedDistrict,
            items: getDistricts(selectedCity).map((district) => DropdownMenuItem(
              value: district,
              child: Text(district),
            )).toList(),
            onChanged: selectedCity == null ? null : (value) {
              setState(() {
                selectedDistrict = value;
                widget.onLocationChanged('$selectedCity $value');
              });
            },
          ),
        ),
      ],
    );
  }
}
```

## API 엔드포인트

### 위치 데이터 조회
```
GET /api/v1/locations/cities
```
**응답:**
```json
[
  "서울특별시",
  "부산광역시",
  "대구광역시",
  ...
]
```

### 시/군/구 데이터 조회
```
GET /api/v1/locations/districts?city={도/시명}
```
**응답:**
```json
[
  "강남구",
  "강동구",
  "강북구",
  ...
]
```

또는 전체 데이터를 한 번에 받아서 클라이언트에서 필터링하는 방식도 가능합니다.

```
GET /api/v1/locations/all
```
**응답:**
```json
{
  "서울특별시": ["강남구", "강동구", ...],
  "부산광역시": ["중구", "서구", ...],
  ...
}
```

---

**작성일**: 2025-10-06
**버전**: 1.0
