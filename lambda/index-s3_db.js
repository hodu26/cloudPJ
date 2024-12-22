const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const DOCUMENTDB_URI = process.env.DOCUMENTDB_URI;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_COURSE_KEY = process.env.S3_COURSE_KEY;

const s3 = new AWS.S3();

exports.handler = async (event) => {
  const { path, httpMethod, queryStringParameters } = event;

  try {
    if (path === "/signup" && httpMethod === "POST") {
      return await handleSignup(event);
    } else if (path === "/login" && httpMethod === "POST") {
      return await handleLogin(event);
    } else if (path === "/courses" && httpMethod === "GET") {
      return await handleFetchCourses(queryStringParameters);
    } else if (path === "/registered-courses" && httpMethod === "GET") {
      return await handleFetchRegisteredCourses(queryStringParameters);
    } else if (path === "/register-course" && httpMethod === "POST") {
      return await handleRegisterCourse(event);
    } else if (path === "/unregister-course" && httpMethod === "POST") {
      return await handleUnregisterCourse(event);
    } else {
      return { statusCode: 404, body: JSON.stringify({ message: "Not Found" }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Handle User Signup
const handleSignup = async (event) => {
  const client = new MongoClient(DOCUMENTDB_URI);
  try {
    const { name, studentId, password, department } = JSON.parse(event.body);
    if (!name || !studentId || !password || !department) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    await client.connect();
    const db = client.db("sugang");
    const existingUser = await db.collection("users").findOne({ studentId });

    if (existingUser) {
      return { statusCode: 400, body: JSON.stringify({ message: "User already exists" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      name,
      studentId,
      password: hashedPassword,
      department,
      registeredCourses: [],
      createdAt: new Date(),
    });

    return { statusCode: 201, body: JSON.stringify({ message: "Signup successful" }) };
  } finally {
    await client.close();
  }
};

// Handle User Login
const handleLogin = async (event) => {
  const client = new MongoClient(DOCUMENTDB_URI);
  try {
    const { studentId, password } = JSON.parse(event.body);
    if (!studentId || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    await client.connect();
    const db = client.db("sugang");
    const user = await db.collection("users").findOne({ studentId });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials" }) };
    }

    const token = jwt.sign({ studentId: user.studentId, name: user.name }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return { statusCode: 200, body: JSON.stringify({ token }) };
  } finally {
    await client.close();
  }
};

// Fetch Courses from S3
const handleFetchCourses = async (queryStringParameters) => {
  const page = parseInt(queryStringParameters?.page) || 1;
  const limit = parseInt(queryStringParameters?.limit) || 20;
  const skip = (page - 1) * limit;
  const searchQuery = queryStringParameters?.search?.trim() || "";

  try {
    const data = await s3
      .getObject({ Bucket: S3_BUCKET_NAME, Key: S3_COURSE_KEY })
      .promise();

    const courses = JSON.parse(data.Body.toString());
    const filteredCourses = courses.filter((course) =>
      course.과목명.includes(searchQuery) ||
      course.담당교수.includes(searchQuery) ||
      course.학과.includes(searchQuery)
    );

    const paginatedCourses = filteredCourses.slice(skip, skip + limit);

    return {
      statusCode: 200,
      body: JSON.stringify({
        courses: paginatedCourses.map((course) => ({
          id: course._id,
          name: course.과목명,
          professor: course.담당교수,
          credits: course.학점,
          registered: course.수강인원,
          capacity: course.수강정원,
          schedule: course.스케줄,
        })),
        totalCourses: filteredCourses.length,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Fetch Registered Courses from S3
const handleFetchRegisteredCourses = async (queryStringParameters) => {
  const studentId = queryStringParameters?.studentId;

  if (!studentId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing studentId" }),
    };
  }

  try {
    const data = await s3
      .getObject({ Bucket: S3_BUCKET_NAME, Key: S3_COURSE_KEY })
      .promise();

    const courses = JSON.parse(data.Body.toString());
    const registeredCourses = courses.filter((course) =>
      course.registeredStudents?.includes(studentId)
    );

    return {
      statusCode: 200,
      body: JSON.stringify(
        registeredCourses.map((course) => ({
          id: course._id,
          name: course.과목명,
          professor: course.담당교수,
          credits: course.학점,
          registered: course.수강인원,
          capacity: course.수강정원,
          schedule: course.스케줄,
        }))
      ),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Register for a Course
const handleRegisterCourse = async (event) => {
  const client = new MongoClient(DOCUMENTDB_URI);
  const { studentId, courseId } = JSON.parse(event.body);

  try {
    await client.connect();
    const db = client.db("sugang");
    const user = await db.collection("users").findOne({ studentId });

    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ message: "User not found" }) };
    }

    if (user.registeredCourses.includes(courseId)) {
      return { statusCode: 400, body: JSON.stringify({ message: "Already registered for this course" }) };
    }

    await db.collection("users").updateOne(
      { studentId },
      { $push: { registeredCourses: courseId } }
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Course registered successfully" }) };
  } finally {
    await client.close();
  }
};

// Unregister from a Course
const handleUnregisterCourse = async (event) => {
  const client = new MongoClient(DOCUMENTDB_URI);
  const { studentId, courseId } = JSON.parse(event.body);

  try {
    await client.connect();
    const db = client.db("sugang");
    await db.collection("users").updateOne(
      { studentId },
      { $pull: { registeredCourses: courseId } }
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Course unregistered successfully" }) };
  } finally {
    await client.close();
  }
};
