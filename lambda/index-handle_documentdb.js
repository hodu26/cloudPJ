const { MongoClient } = require("mongodb");

// DocumentDB와의 연결을 위한 설정 값 (환경 변수 사용)
const DOCUMENTDB_URI = process.env.DOCUMENTDB_URI; // DocumentDB의 연결 URI
const CONNECTION_POOL_SIZE = parseInt(process.env.CONNECTION_POOL_SIZE || "10", 10); // 커넥션 풀 크기
const SERVER_SELECTION_TIMEOUT = parseInt(process.env.SERVER_SELECTION_TIMEOUT || "5000", 10); // 서버 선택 타임아웃 (밀리초)
const TLS_CERT_PATH = `${__dirname}/global-bundle.pem`; // DocumentDB TLS 인증서 경로

// MongoDB 클라이언트 객체와 연결 Promise를 글로벌 변수로 설정
let client;
let clientPromise;

/**
 * DocumentDB 연결을 관리하는 함수
 * - Lambda의 콜드 스타트 문제를 해결하기 위해 커넥션 풀을 재사용
 * - 클라이언트가 없으면 새로 생성하고, 이미 존재하면 기존 클라이언트를 반환
 */
const connectToDatabase = async () => {
  if (!client || !clientPromise) {
    // 클라이언트가 없을 경우 새 클라이언트 생성
    client = new MongoClient(DOCUMENTDB_URI, {
      tls: true, // DocumentDB의 TLS 연결 활성화
      tlsCAFile: TLS_CERT_PATH, // 인증서 경로 설정
      tlsInsecure: false, // 인증서 검증 활성화
      poolSize: CONNECTION_POOL_SIZE, // 커넥션 풀 크기 설정
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT, // 서버 선택 타임아웃 설정
      retryWrites: false, // DocumentDB에서 재시도 비활성화
    });

    // 클라이언트 연결 Promise를 설정
    clientPromise = client.connect();
    await clientPromise; // 연결이 완료될 때까지 대기
  }

  return client; // 클라이언트 반환
};

/**
 * Lambda 핸들러 함수
 * - Lambda가 호출될 때 실행되며 DocumentDB와 상호작용
 * - 커넥션을 관리하고 비즈니스 로직을 처리
 */
exports.handler = async (event) => {
  try {
    console.log("Received Event:", JSON.stringify(event, null, 2)); // Lambda에 전달된 이벤트를 로그에 출력

    // DocumentDB 연결 가져오기
    const dbClient = await connectToDatabase();
    const db = dbClient.db("sugang"); // 'sugang' 데이터베이스 선택

    // 샘플 비즈니스 로직: 강의 데이터를 가져오기
    const courses = await db.collection("courses").find({}).limit(10).toArray();

    // 성공적으로 데이터를 처리한 경우 응답 반환
    return {
      statusCode: 200,
      body: JSON.stringify({ courses }),
    };
  } catch (error) {
    console.error("Error in handler:", error); // 오류 로그 출력

    // 오류 발생 시 응답 반환
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
