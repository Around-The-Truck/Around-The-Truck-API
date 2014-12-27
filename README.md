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

  {"code":200,
   "result":[{"idx":2,"name":"희정이의특제케밥트럭","gps_longitude":126.9876808,"gps_latitude":37.4292171,"gps_altitude":30.94,"gps_address":"경기도 과천시 중앙동 1-3","todays_sum":null,"start_yn":null,"follow_count":null,"photo_id":null,"takeout_yn":null,"main_position":null,"category_id":null}]}

* gps 정보는 옵션입니다.
    * 넘어왔을 경우, 가까운 순으로 정렬해서 보내줍니다.
* 이름으로 검색할 때는 gps 정보가 넘어왔든 아니든 상관 안합니다. (당연한가요?)
* 각 상황 별 에러 코드를 같이 json 으로 리턴합니다. CodePage.txt 를 참고해주세요!

### 한개 트럭 정보 불러오기
* 한 개의 푸드트럭 정보만 받아옵니다.
    * GET http://165.194.35.161:3000/getTruckInfo
* params
| params    | 설명            |
| -------   | --------------- |
| truckIdx | 트럭의 idx 넘버 |
 * json 으로 리턴합니다.

   {"code":200,
    "result":[{"idx":1,"name":"맛있는새우트럭","phone_num":null,"gps_longitude":126.980444,"gps_latitude":37.494529,"gps_altitude":30.94,"gps_address":"한국 서울특별시 동작구 동작동 63-22","todays_sum":null,"start_yn":1,"start_time":"2014-12-20T11:14:40.000Z","follow_count":null,"photo_id":null,"main_position":null,"category_id":null,"category_small":null,"takeout_yn":null,"cansit_yn":null,"card_yn":null,"reserve_yn":null,"group_order_yn":null,"always_open_yn":null,"reg_date":null,"open_date":null}]}

