const fs = require("fs");
const AWS = require("aws-sdk");
const { ObjectId } = require("mongodb");
require("dotenv").config();

// S3 설정
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "my-local-bucket";
const S3_COURSE_KEY = process.env.S3_COURSE_KEY || "courses.json";
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test", // LocalStack에서는 더미 값 사용
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  region: process.env.AWS_DEFAULT_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_URI || "http://localhost:8080", // LocalStack의 엔드포인트
  s3ForcePathStyle: true, // Path-style 접근 필요
});

// JSON 데이터에 MongoDB ObjectId 추가
const addObjectIdToCourses = (courses) => {
  return courses.map((course) => ({
    _id: new ObjectId(), // MongoDB의 ObjectId 생성
    ...course,
  }));
};

// S3에서 데이터 가져오기
const fetchCoursesFromS3 = async () => {
  try {
    const data = await s3
      .getObject({ Bucket: S3_BUCKET_NAME, Key: S3_COURSE_KEY })
      .promise();

    return JSON.parse(data.Body.toString());
  } catch (err) {
    console.error("Error fetching courses from S3:", err.message);
    throw err;
  }
};

// S3에 업데이트된 데이터 업로드
const uploadUpdatedCoursesToS3 = async (updatedCourses) => {
  try {
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: S3_COURSE_KEY,
      Body: JSON.stringify(updatedCourses, null, 2),
      ContentType: "application/json",
    };

    await s3.upload(params).promise();
    console.log("Updated courses uploaded to S3 successfully.");
  } catch (err) {
    console.error("Error uploading updated courses to S3:", err.message);
    throw err;
  }
};

// 실행 함수
const main = async () => {
  try {
    console.log("Fetching courses from S3...");
    const courses = await fetchCoursesFromS3();

    console.log("Adding MongoDB ObjectIds to courses...");
    const updatedCourses = addObjectIdToCourses(courses);

    console.log("Uploading updated courses to S3...");
    await uploadUpdatedCoursesToS3(updatedCourses);

    console.log("Process completed successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  }
};

main();
