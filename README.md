Around-The-Truck-API
====================

## 트럭리스트 불러오기
 * 일단 get으로 해놨습니다. (추후에 바꿀꺼임)
 * http://165.194.35.161:3000/getTruckList
 * json 으로 리턴합니다.
 * ex) ["code":200,"result":[{"idx":2,"name":"희정이의특제케밥트럭","gps_longitude":126.9876808,"gps_latitude":37.4292171,"gps_altitude":30.94,"gps_address":"경기도 과천시 중앙동 1-3","todays_sum":null,"start_yn":null,"follow_count":null,"photo_id":null,"takeout_yn":null,"main_position":null,"category_id":null}]]

### params
 * truckName : 트럭 이름으로 검색할 때
 * latitude : 위도
 * longitude : 경도
 * addrStr : 서울, 경기 이런 식으로 주소 검색할 때

 * 이름으로 검색할 때는 gps 정보를 따지지 않습니다. (당연한가요?)
 * 각 상황 별 에러 코드를 같이 json 으로 리턴합니다. CodePage.txt 를 참고해주세요!

## 한개 트럭 정보 불러오기
 * http://165.194.35.161:3000/getTruckInfo
 * json 리턴.

### params
 * truckIdx : 트럭의 인덱스 넘버