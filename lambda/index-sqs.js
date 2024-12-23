const { MongoClient, ObjectId } = require("mongodb");

const DOCUMENTDB_URI = process.env.DOCUMENTDB_URI;
const certificatePath = `${__dirname}/global-bundle.pem`;

exports.handler = async (event) => {
  const client = new MongoClient(DOCUMENTDB_URI, {
    tls: true,
    tlsCAFile: certificatePath,
    tlsInsecure: false,
    retryWrites: false,
  });

  try {
    await client.connect();
    const db = client.db("sugang");

    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log("Processing message:", message);

      if (message.action === "register") {
        await registerCourse(db, message.studentId, message.courseId);
      } else if (message.action === "unregister") {
        await unregisterCourse(db, message.studentId, message.courseId);
      } else {
        console.error("Unknown action:", message.action);
      }
    }
  } catch (error) {
    console.error("Error processing messages:", error);
  } finally {
    await client.close();
  }
};

const registerCourse = async (db, studentId, courseId) => {
  const course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
  if (!course) {
    console.error(`Course not found: ${courseId}`);
    return;
  }

  if (course.수강인원 >= course.수강정원) {
    console.error(`Course is full: ${courseId}`);
    return;
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

  console.log(`Successfully registered course: ${courseId}`);
};

const unregisterCourse = async (db, studentId, courseId) => {
  await db.collection("users").updateOne(
    { studentId },
    { $pull: { registeredCourses: courseId } }
  );

  await db.collection("courses").updateOne(
    { _id: new ObjectId(courseId) },
    { $inc: { 수강인원: -1 } }
  );

  console.log(`Successfully unregistered course: ${courseId}`);
};
