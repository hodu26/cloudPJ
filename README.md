# 🌐 클라우드 컴퓨팅 최종 프로젝트

이 저장소는 AWS 서비스를 활용한 수강신청 플랫폼의 클라우드 기반 시스템 구현 내용을 담고 있습니다. **S3**, **CloudFront**, **DocumentDB**, **Lambda**, **SQS**를 활용하여 확장성, 가용성 및 비용 효율성을 보장하면서도 보안을 유지하고 최적화된 작업을 수행합니다.

## ⭐ 주요 기능

### ✨ 핵심 기능
- **수강신청 시스템**:
  - 학생들이 강의를 조회하고, 수강신청 및 취소를 할 수 있습니다.
  - 대규모 트래픽과 실시간 업데이트를 고려한 설계.
- **사용자 인증**:
  - 해시된 비밀번호와 JWT를 사용한 안전한 회원가입 및 로그인.

### 🏗️ 인프라
- **DocumentDB**:
  - MongoDB 호환성과 관리형 서비스의 편리함을 고려한 선택.
  - 멀티 AZ 고가용성과 낮은 대기시간의 읽기/쓰기 최적화.
- **S3 + CloudFront**:
  - S3는 정적 파일 저장소로 사용.
  - CloudFront는 전 세계 엣지 로케이션에서 캐싱을 통해 낮은 대기시간을 보장.
- **Lambda Functions**:
  - 사용자 인증, 수강신청 처리 및 데이터 조회 등의 백엔드 작업을 처리.
  - 효율적인 데이터베이스 상호작용을 위한 커넥션 풀링 최적화.
- **SQS**:
  - FIFO 큐로 트래픽 급증 상황에서도 요청 순서를 보장.
- **CloudWatch Alarms**:
  - 시스템 성능을 모니터링하고 관리자에게 경고를 발송.

## 🛠️ 주요 기술 스택

![AWS Lambda](https://img.shields.io/badge/-AWS%20Lambda-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![Amazon S3](https://img.shields.io/badge/-Amazon%20S3-569A31?style=flat-square&logo=amazons3&logoColor=white)
![Amazon CloudFront](https://img.shields.io/badge/-Amazon%20CloudFront-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![DocumentDB](https://img.shields.io/badge/-DocumentDB-6DB33F?style=flat-square&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)

## 🏗️ 아키텍처

![Architecture Diagram](https://github.com/user-attachments/assets/74ff68d3-7c99-4688-91da-4bca97fdf6d0)
( CloudFront -> lambda-db.js (로그인, 강의 불러오기) -> SQS -> lambda-sqs.js (수강신청 처리) )

### 🗂️ 프로젝트 구조

```plaintext
📦 프로젝트 루트
├── 📂 src
│   ├── 📂 components       # React 컴포넌트
│   ├── 📂 pages            # 페이지 구성
│   ├── 📂 utils            # 유틸리티 함수
│   ├── 📂 api              # API 호출 모듈
├── 📂 public               # 정적 파일
├── 📜 buildspec.yaml       # Code Pipeline 배포 파일
├── 📜 README.md            # 프로젝트 설명서
|
├── 📂 lambda
|   ├── 📂 server.js                  # local-test용
│   ├── 📂 index-db.js                # lambda - 백엔드 1
│   ├── 📂 index-sqs.js               # lambda - 백엔드 
│   ├── 📂 add_json_to_documents      # documentDB에 json 삽입하는 lambda
│   ├── 📂 convert_to_json.py         # excel to json 변환
```

## 📱 주요 화면

### 로그인/회원가입 (서울 리전)

![Login-Seoul](https://github.com/user-attachments/assets/d700d6be-7c5a-4142-8266-fc6cd4e1e6be)


### 수강신청 페이지 (버지니아 리전)

![Sugnag-Versinia](https://github.com/user-attachments/assets/f8492cf5-6918-468f-8c4a-ebf515c97b71)


### 🔧 주요 구성 요소
1. **API Gateway**: HTTP 요청을 적절한 Lambda 함수로 라우팅.
2. **Lambda Functions**: CRUD 작업 수행 및 DocumentDB와 통신.
3. **SQS**: 수강신청 요청을 순차적으로 처리.
4. **DocumentDB**: 사용자 및 강의 데이터 저장.
5. **S3 + CloudFront**:
   - S3는 React 프론트엔드와 정적 파일을 저장.
   - CloudFront는 전 세계 엣지 로케이션에서 콘텐츠를 빠르게 제공.
6. **CloudWatch**: 시스템 메트릭, 오류 및 로그를 추적하여 문제 해결 지원.

## 🤔 DocumentDB와 S3 + CloudFront 선택 이유

### DocumentDB
- **관리형 서비스**: 백업, 스케일링 및 패치 작업을 자동화하여 운영 부담 감소.
- **MongoDB 호환성**: 기존 MongoDB 기반 애플리케이션과의 원활한 통합.
- **고가용성**: 멀티 AZ 지원으로 다운타임 최소화.

### S3 + CloudFront
- **비용 효율성**: S3는 저비용 저장소이며, CloudFront는 캐시된 응답으로 대역폭 비용 절감.
- **글로벌 가용성**: CloudFront의 엣지 로케이션은 전 세계에서 낮은 대기시간을 보장.
- **리전 이중화**: CloudFront를 통한 서울/버지니아 리전 이중화.
- **확장성**: 수동 개입 없이도 대규모 트래픽 처리.

## ⚙️ 설정 방법

### 사전 준비
- AWS CLI 설치 및 구성.
- Node.js (v20+) 설치.
- S3, CloudFront, Lambda, DocumentDB 등 AWS 서비스 접근 권한.

### 배포 단계

#### 로컬

1. **프론트엔드 실행**:
   - React 애플리케이션 실행:
     ```bash
     npm install
     npm start
     ```

3. **백엔드 실행**:
   - Lambda 함수를 패키징하고 localstack, mongoDB연결.
   - express.js를 통해 server.js 구성 및 실행
     ```bash
     npm install
     node server.js
     ```

4. **데이터베이스 초기화**:
   - Mongo Compass나 mongoimport를 통해 초기 강의 데이터를 DocumentDB에 입력:
     ```bash
     mongoimport --uri <documentdb-uri> --collection courses --file courses.json --jsonArray
     ```

#### AWS

1. **프론트엔드 자동 배포**:
   - AWS Code Pipeline 사용
   - React 애플리케이션 빌드:
     ```bash
     npm install
     npm run build
     ```
   - 빌드 폴더를 S3 버킷에 동기화:
     ```bash
     aws s3 sync build/ s3://<your-bucket-name> --delete
     ```
   - CloudFront를 S3 버킷을 원본으로 설정.

3. **백엔드 배포**:
   - Lambda 함수를 패키징하고 AWS Lambda에 업로드.
   - Lambda를 API Gateway와 연결.

4. **데이터베이스 초기화**:
   - add_json_to_documents lambda 배포를 초기 강의 데이터를 DocumentDB에 입력.

5. **SQS 구성**:
   - SQS FIFO 큐 생성.
   - Lambda가 큐에서 메시지를 처리하도록 설정.

6. **모니터링 설정**:
   - CloudWatch 경보를 설정하여 다음 항목을 추적:
     - API Gateway 요청 수.
     - SQS 메시지 대기열 길이.
     - DocumentDB 연결 활용률.
     - 등등

       ![CloudWatch 모니터링](https://github.com/user-attachments/assets/8e74a1b6-3210-4dbb-a70d-3b9aeb31117c)


## 🧪 테스트 (예정)
- **Apache JMeter** 또는 **Artillery**와 같은 도구를 사용해 고트래픽 시뮬레이션.
- CloudWatch 메트릭에서 다음 항목을 모니터링:
  - 지연 시간.
  - 오류율.
  - 리소스 활용도.
