Around-The-Truck-API
====================

## Ʈ������Ʈ �ҷ�����
 * �ϴ� get���� �س����ϴ�. (���Ŀ� �ٲܲ���)
 * http://165.194.35.161:3000/getTruckList
 * json ���� �����մϴ�.
 * ex) ["code":200,"result":[{"idx":2,"name":"��������Ư���ɹ�Ʈ��","gps_longitude":126.9876808,"gps_latitude":37.4292171,"gps_altitude":30.94,"gps_address":"��⵵ ��õ�� �߾ӵ� 1-3","todays_sum":null,"start_yn":null,"follow_count":null,"photo_id":null,"takeout_yn":null,"main_position":null,"category_id":null}]]

### params
 * truckName : Ʈ�� �̸����� �˻��� ��
 * latitude : ����
 * longitude : �浵
 * addrStr : ����, ��� �̷� ������ �ּ� �˻��� ��

 * �̸����� �˻��� ���� gps ������ ������ �ʽ��ϴ�. (�翬�Ѱ���?)
 * �� ��Ȳ �� ���� �ڵ带 ���� json ���� �����մϴ�. CodePage.txt �� �������ּ���!

## �Ѱ� Ʈ�� ���� �ҷ�����
 * http://165.194.35.161:3000/getTruckInfo
 * json ����.

### params
 * truckIdx : Ʈ���� �ε��� �ѹ�