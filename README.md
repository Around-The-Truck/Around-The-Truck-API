Around-The-Truck-API
====================

### 푸드트럭 리스트 불러오기
* 푸드트럭의 리스트를 받아옵니다.
    * GET http://165.194.35.161:3000/getTruckList
* params 

| params    | 설명            |
| -------   | --------------- |
| truckName | 트럭 이름으로 검색할 때          |
| [latitude]  | 위도 |
| [longitude] | 경도    |
| addrStr   | 서울, 경기 이런 식으로 주소 검색할 때 |
* json 으로 리턴합니다. ex)

```
  {"code":200,
   "result":[{"idx":2,"name":"희정이의특제케밥트럭","gps_longitude":126.9876808,"gps_latitude":37.4292171,"gps_altitude":30.94,"gps_address":"경기도 과천시 중앙동 1-3","todays_sum":null,"start_yn":null,"follow_count":null,"photo_id":null,"takeout_yn":null,"main_position":null,"category_id":null}]}
```

* gps 정보는 옵션입니다.
    * 넘어왔을 경우, 가까운 순으로 정렬해서 보내줍니다.
* 이름으로 검색할 때는 gps 정보가 넘어왔든 아니든 상관 안합니다. (당연한가요?)
* 각 상황 별 에러 코드를 같이 json 으로 리턴합니다. [CodePage.txt](CodePage.txt) 를 참고해주세요!

### 한개 트럭 정보 불러오기
* 한 개의 푸드트럭 정보만 받아옵니다.
    * GET http://165.194.35.161:3000/getTruckInfo
* params 

| params    | 설명            |
| -------   | --------------- |
| truckIdx | 트럭의 idx 넘버 |
 * json 으로 리턴합니다.

```
   {"code":200,
    "result":[{"idx":1,"name":"맛있는새우트럭","phone_num":null,"gps_longitude":126.980444,"gps_latitude":37.494529,"gps_altitude":30.94,"gps_address":"한국 서울특별시 동작구 동작동 63-22","todays_sum":null,"start_yn":1,"start_time":"2014-12-20T11:14:40.000Z","follow_count":null,"photo_id":null,"main_position":null,"category_id":null,"category_small":null,"takeout_yn":null,"cansit_yn":null,"card_yn":null,"reserve_yn":null,"group_order_yn":null,"always_open_yn":null,"reg_date":null,"open_date":null}]}
```

### 트럭 회원가입 - 고유번호 입력
* 사전에 받은 고유번호가 맞는지 확인해 줍니다.
    * GET http://165.194.35.161:3000/truckNumCheck
* params 

| params    | 설명            |
| -------   | --------------- |
| num | 트럭의 idx 넘버 |

* json 으로 리턴합니다. 주요 코드는 아래와 같습니다. (CodePage.txt에 다 있음)

| code    | 설명            |
| -------   | --------------- |
| 108 | 트럭고유번호 조회 실패 |
| 109 | 잘못된 트럭 고유번호 (디비에 존재하지 않음!) |
| **110** | **트럭고유번호 조회 성공 (트럭정보입력 가능!)** |
| 111 | 트럭이 여러개...? (디비 무결성 파괴됨!!!! 으앙) |

### 트럭 회원가입 - 정보입력
* 회원가입 메인입니다. 프로필 사진 업로드가 포함되어 있습니다.
* multipart 로 쏴주세요!
 * POST http://165.194.35.161:3000/truckJoin
* params 

| params    | 설명            | 예시 | type |
| -------   | --------------- | -- | -- |
| idx | 트럭고유번호 | | |
| truckName | 트럭 이름 | | |
| phone | 전화번호 | | |
| open_date | 오픈 일자 | 2014-12-25 12:00:00 | string |
| file | 프로필 사진 | | |
| category_big | 대분류 | | int |
| category_small | 소분류 | | int |
| takeout_yn | 테이크아웃 가능여부 | | 0,1 |
| cansit_yn | 착석 가능여부 | | 0,1 |
| card_yn | 카드결제 가능여부 | | 0,1 |
| reserve_yn | 예약 가능여부 | | 0,1 |
| group_order_yn | 단체주문 가능여부 | | 0,1 |
| always_open_yn | 연중무휴 가능여부 | | 0,1 |

* json 으로 리턴합니다. (너무 많네요..) [CodePage.txt](CodePage.txt)

### 트럭 장사 시작
* 장사 시작입니다. 3번 트럭의 경우, 
  * GET http://165.194.35.161:3000/truckStart?idx=3
* json 으로 리턴합니다. 주요 코드는 다음과 같습니다. 

| code    | 설명            |
| -------   | --------------- |
| 204 | 트럭 start 오류 |
| **205** | **정상적으로 장사 시작됨.** |

### 트럭 장사 끝
* 장사 끝 입니다. 3번 트럭의 경우, 
  * GET http://165.194.35.161:3000/truckEnd?idx=3
* json 으로 리턴합니다. 주요 코드는 다음과 같습니다. 

| code    | 설명            |
| -------   | --------------- |
| 206 | 트럭 end 오류 (truck.start_yn) |
| 207 | 트럭 end 오류 (open_history) |
| **208** | **정상적으로 장사 끝남.** |

### 손님 회원가입
* 손님 회원가입입니다. 
  * GET http://165.194.35.161:3000/join
* params

| params    | 설명            | 예시 |
| -------   | --------------- | |
| userName | 사용자 이름 | |
| age | 나이 | |
| gender | 성별 | 0,1 |
| job | 직업 | |
| phone | 전화번호 | |

* json으로 리턴합니다. [CodePage.txt](CodePage.txt)