const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const DOCUMENTDB_URI = process.env.DOCUMENTDB_URI;

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
        createdAt: new Date() 
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

// Fetch Courses
const handleFetchCourses = async (queryStringParameters) => {
    const client = new MongoClient(DOCUMENTDB_URI);
  
    const page = parseInt(queryStringParameters?.page) || 1;
    const limit = parseInt(queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    const searchQuery = queryStringParameters?.search?.trim() || '컴퓨터';
  
    try {
      await client.connect();
      const db = client.db("sugang");
  
      // 검색 조건 생성
      const searchFilter = searchQuery
        ? {
            $or: [
              { 과목명: { $regex: searchQuery, $options: 'i' } },
              { 담당교수: { $regex: searchQuery, $options: 'i' } },
              { 학과: { $regex: searchQuery, $options: 'i' } },
            ],
          }
        : {};
  
      const courses = await db.collection("courses")
        .find(searchFilter)
        .skip(skip)
        .limit(limit)
        .toArray();
  
      const totalCourses = await db.collection("courses").countDocuments(searchFilter);
  
      return {
        statusCode: 200,
        body: JSON.stringify({
          courses: courses.map(course => ({
            id: course._id.toString(),
            name: course.과목명,
            professor: course.담당교수,
            credits: course.학점,
            registered: course.수강인원,
            capacity: course.수강정원,
            schedule: course.스케줄,
          })),
          totalCourses,
        }),
      };
    } finally {
      await client.close();
    }
  };

// Fetch Registered Courses
const handleFetchRegisteredCourses = async (queryStringParameters) => {
    const client = new MongoClient(DOCUMENTDB_URI);
    const studentId = queryStringParameters?.studentId || '202012233'
  
    try {
      if (!studentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Missing studentId" }),
        };
      }
  
      await client.connect();
      const db = client.db("sugang");
      const user = await db.collection("users").findOne({ studentId });
  
      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "User not found" }),
        };
      }
  
      const registeredCourses = await db.collection("courses")
        .find({ _id: { $in: user.registeredCourses.map(id => new ObjectId(id)) } })
        .toArray();
  
      return {
        statusCode: 200,
        body: JSON.stringify(registeredCourses.map(course => ({
          id: course._id.toString(),
          name: course.과목명,
          professor: course.담당교수,
          credits: course.학점,
          registered: course.수강인원,
          capacity: course.수강정원,
          schedule: course.스케줄,
        })))
      };
    } finally {
      await client.close();
    }
  };
  

// Register for a Course
const handleRegisterCourse = async (event) => {
  const client = new MongoClient(DOCUMENTDB_URI);
  const { studentId, courseId } = JSON.parse(event.body);

  try {
    await client.connect();
    const db = client.db("sugang");
    const course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });

    if (!course) {
      return { statusCode: 404, body: JSON.stringify({ message: "Course not found" }) };
    }

    if (course.수강인원 >= course.수강정원) {
      return { statusCode: 400, body: JSON.stringify({ message: "Course is full" }) };
    }

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

    await db.collection("courses").updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { 수강인원: 1 } }
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

    await db.collection("courses").updateOne(
      { _id: new ObjectId(courseId) },
      { $inc: { 수강인원: -1 } }
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Course unregistered successfully" }) };
  } finally {
    await client.close();
  }
};