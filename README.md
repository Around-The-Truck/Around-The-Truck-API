Around-The-Truck-API
====================

## 목차
[푸드트럭 리스트 불러오기](#푸드트럭 리스트 불러오기)
[한개 트럭 정보 불러오기](#한개 트럭 정보 불러오기)
[트럭 회원가입 - 고유번호 입력](#트럭 회원가입 - 고유번호 입력)
[트럭 회원가입 - 정보입력](#트럭 회원가입 - 정보입력)
[트럭 장사 시작](#트럭 장사 시작)
[트럭 장사 끝](#트럭 장사 끝)
[손님 회원가입](#손님 회원가입)
[글 정보 받아오기](#글 정보 받아오기)
[글 리스트 받아오기](#글 리스트 받아오기)
[사용자별 follow 리스트 받아오기](#사용자별 follow 리스트 받아오기)
[사용자의 point 획득내역 받아오기](#사용자의 point 획득내역 받아오기)
[댓글 달기](#댓글 달기)
[댓글 목록 받아오기](#댓글 목록 받아오기)
====================
====================

### 푸드트럭 리스트 불러오기
* 푸드트럭의 리스트를 받아옵니다.
    * GET http://165.194.35.161:3000/getTruckList
* params 

| params    | 설명            |
| -------   | --------------- |
| [truckName] | 트럭 이름으로 검색할 때          |
| [latitude]  | 위도 |
| [longitude] | 경도    |
| [addrStr]   | 서울, 경기 이런 식으로 주소 검색할 때 |
* json 으로 리턴합니다. ex)

```
{"code":200,"result":[{"idx":1,"name":"맛있는새우트럭","phone_num":null,"gps_longitude":126.980444,
"gps_latitude":37.494529,"gps_altitude":30.94,"gps_address":"한국 서울특별시 동작구 동작동 63-22",
"todays_sum":null,"start_yn":0,"start_time":"NaN-NaN-NaN NaN:NaN:NaN","follow_count":null,
"photo_id":null,"main_position":null,"category_id":null,"category_small":null,"takeout_yn":null,
"cansit_yn":null,"card_yn":null,"reserve_yn":null,"group_order_yn":null,"always_open_yn":null,
"reg_date":"1970-01-01 09:00:00","open_date":"1970-01-01 09:00:00"},
{"idx":2,"name":"희정이의특제케밥트럭","phone_num":null,"gps_longitude":126.9876808,
"gps_latitude":37.4292171,"gps_altitude":30.94,"gps_address":"경기도 과천시 중앙동 1-3",
"todays_sum":null,"start_yn":null,"start_time":"1970-01-01 09:00:00","follow_count":null,
"photo_id":null,"main_position":null,"category_id":null,"category_small":null,
"takeout_yn":null,"cansit_yn":null,"card_yn":null,"reserve_yn":null,"group_order_yn":null,
"always_open_yn":null,"reg_date":"1970-01-01 09:00:00","open_date":"1970-01-01 09:00:00"}]}
```

* 모든 파라미터는 옵션입니다.
    * 트럭 이름이 넘어왔을 경우, 그 이름이 들어간 트럭을 검색해서 보내줍니다. 이게 최우선 priority 입니다.
    * 주소가 넘어왔을 경우, 트럭 gps 주소를 검색해서 보내줍니다. 
      * 물론 트럭 이름이 같이 넘어왔다면(그럴 일은 없겠지만), 트럭 이름으로 검색합니다.
    * truckName이 넘어왔을 경우, 가까운 순으로 정렬해서 보내줍니다.
    * gps 정보가 같이 넘어왔다면, 거리순으로 order by 해서 보내줍니다.

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
"result":[{"idx":1,"name":"맛있는새우트럭","phone_num":null,"gps_longitude":126.980444,
"gps_latitude":37.494529,"gps_altitude":30.94,"gps_address":"한국 서울특별시 동작구 동작동 63-22",
"todays_sum":null,"start_yn":1,"start_time":"2014-12-20T11:14:40.000Z","follow_count":null,
"photo_id":null,"main_position":null,"category_id":null,"category_small":null,
"takeout_yn":null,"cansit_yn":null,"card_yn":null,"reserve_yn":null,"group_order_yn":null,
"always_open_yn":null,"reg_date":null,"open_date":null}]}
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
| -------   | --------------- | ----- | ------ |
| idx | 트럭고유번호 |  |  |
| truckName | 트럭 이름 |  |  |
| phone | 전화번호 |  |  |
| open_date | 오픈 일자 | 2014-12-25 12:00:00 | string |
| file | 프로필 사진 |  |  |
| category_big | 대분류 |  | int |
| category_small | 소분류 |  | int |
| takeout_yn | 테이크아웃 가능여부 |  | 0,1 |
| cansit_yn | 착석 가능여부 |  | 0,1 |
| card_yn | 카드결제 가능여부 |  | 0,1 |
| reserve_yn | 예약 가능여부 |  | 0,1 |
| group_order_yn | 단체주문 가능여부 |  | 0,1 |
| always_open_yn | 연중무휴 가능여부 |  | 0,1 |

* json 으로 리턴합니다. (너무 많네요..) [CodePage.txt](CodePage.txt)

### 트럭 장사 시작
* 장사 시작입니다.
  * POST http://165.194.35.161:3000/truckStart?idx=3

* params 

| params    | 설명            |
| -------   | --------------- |
| idx | 트럭고유번호 |
| lat | gps latitude |
| lng | gps longitude |

* json 으로 리턴합니다. 주요 코드는 다음과 같습니다. 

| code    | 설명            |
| -------   | --------------- |
| 204 | 트럭 start 오류 |
| **205** | **정상적으로 장사 시작됨.** |
| 212 |  이미 장사 시작됨 |

### 트럭 장사 끝
* 장사 끝 입니다. 3번 트럭의 경우, 
  * GET http://165.194.35.161:3000/truckEnd?idx=3
* json 으로 리턴합니다. 주요 코드는 다음과 같습니다. 

| code    | 설명            |
| -------   | --------------- |
| 206 | 트럭 end 오류 (truck.start_yn) |
| 207 | 트럭 end 오류 (open_history) |
| **208** | **정상적으로 장사 끝남.** |
| 213 |  이미 장사 끝남 |

### 손님 회원가입
* 손님 회원가입입니다. 
  * GET http://165.194.35.161:3000/join
* params

| params    | 설명            | 예시 |
| -------   | --------------- | ------ |
| userName | 사용자 이름 | |
| age | 나이 | |
| gender | 성별 | 0,1 |
| job | 직업 | |
| phone | 전화번호 | |

* json으로 리턴합니다. [CodePage.txt](CodePage.txt)

### 글 정보 받아오기
* 한개의 글 정보를 받아옵니다.
  * POST http://165.194.35.161:3000/getArticle
* params

| params    | 설명            |
| -------   | --------------- |
| idx | article의 idx |

 * json 으로 리턴합니다.

```
  {"code":300,"result":[{"idx":1,"filename":"13년 생일파티.jpg",
  "writer":"1","writer_type":1,"contents":"아주 맛있다!","like":32,
  "belong_to":"1","reg_date":"2014-12-28 11:00:58"}]}
```

### 글 리스트 받아오기
* 여러개의 글 정보를 받아옵니다.
* writer에 트럭의 idx 를 넘기면 트럭의 타임라인 정보로 사용할 수 있습니다.
  * POST http://165.194.35.161:3000/getArticleList
* params

| params    | 설명            |
| -------   | --------------- |
| writer | 글쓴이의 고유식별자(phone 또는 트럭idx). |
| writer_type | 글쓴이 타입. (customer:0, truck:1) |

* type이 있으므로 writer에 구분없이 넣어도 구별 가능합니다.

* json으로 리턴합니다.

```
  {"code":300,
  "result":[{"idx":2,"filename":"default_image.jpg","writer":"1",
  "writer_type":1,"contents":"맛없다..","like":"like","belong_to":"1",
  "reg_date":"2014-04-09 16:07:02"},
  {"idx":1,"filename":"13년 생일파티.jpg","writer":"1",
  "writer_type":1,"contents":"아주 맛있다!","like":"like","belong_to":"1",
  "reg_date":"2014-12-28 11:00:58"}]}
```

### 사용자별 follow 리스트 받아오기
* 특정 사용자의 follow 리스트를 받아옵니다.
* GET http://165.194.35.161:3000/getFollowList
* params
  * phoneNum : 특정 사용자의 폰번호

* json으로 리턴합니다.

### 사용자의 point 획득내역 받아오기
* 특정 사용자의 follow 리스트를 받아옵니다.
* GET http://165.194.35.161:3000/getPointHistory
* params
  * phoneNum : 특정 사용자의 폰번호

* json으로 리턴합니다.

### 댓글 달기
* 특정 글에 댓글을 답니다.
* POST http://165.194.35.161:3000/addReply
* params

| params    | 설명            |
| -------   | --------------- |
| articleIdx | 글의 고유 식별자 |
| writer | 글쓴이의 고유식별자. 사용자는 폰번호, 트럭은 트럭번호 |
| writerType | 글쓴이 타입. 사용자는 0, 트럭은 1 |
| contents | 내용 |

* json으로 리턴합니다.
  * [CodePage.txt](CodePage.txt)

### 댓글 목록 받아오기
* 특정 글에 달린 댓글들을 받아옵니다.
* POST http://165.194.35.161:3000/getReplyList
* params
 * articleIdx : 글번호
* json으로 리턴합니다.

```
  {"code":600,"result":[{"idx":1,"contents":"와 진짜 맛있어 보이네요 ㅎㅎ",
  "writer":"01044550423","writer_type":0,"article_idx":1,
  "reg_date":"2015-01-03 16:52:03"},
  {"idx":3,"contents":"저기 빨간건 재료가 뭔가요?",
  "writer":"01044550423","writer_type":0,"article_idx":1,
  "reg_date":"2015-01-03 17:55:06"}]}
```