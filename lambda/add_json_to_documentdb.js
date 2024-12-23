const { MongoClient } = require("mongodb");
const fs = require('fs');
const AWS = require("aws-sdk");

const certificatePath = `${__dirname}/global-bundle.pem`;
const coursesPath = `${__dirname}/courses_computer.json`;

const DOCUMENTDB_URI = process.env.DOCUMENTDB_URI;

exports.handler = async (event) => {
  const { http } = event.requestContext;

  try {
    if (http.path === "/signup" && http.method === "POST") {
      console.log("signup")
      return await handleSignup(event);
    } else {
      return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
    }
  } catch (err) {
    console.error("Error handling request:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Handle User Signup
const handleSignup = async (event) => {

  const client = new MongoClient(DOCUMENTDB_URI, {
    tls: true,
    tlsCAFile: certificatePath, // 인증서 파일 설정
    tlsInsecure: false, // 서버 인증서를 검증 (권장)
    retryWrites: false, // DocumentDB에선 retryWrites가 비활성화되어야 함
  });

  try {
    // Connect to DocumentDB
    await client.connect();
    const db = client.db("sugang");
    console.log("connect")

    const fileData = fs.readFileSync(coursesPath, 'utf8');
    const courses = JSON.parse(fileData);
    console.log("converted")

    // Insert courses into the 'courses' collection
    const coursesCollection = db.collection("courses");
    console.log("start");
    await coursesCollection.insertMany(courses);
    console.log("end");

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Signup and courses insertion successful" }),
    };
  } catch (err) {
    console.error("Error during signup:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.close();
  }
};
