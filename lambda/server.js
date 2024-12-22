const express = require('express');
const { handler } = require('./lambda-db'); // Lambda 코드 파일  ( local : lambda-s3_db, lambda-db || aws : index-s3_db, index-db )

const app = express();

// CORS 설정
const cors = require('cors');
app.use(cors()); // 기본적으로 모든 도메인 허용
app.use(express.json());

app.all('*', async (req, res) => {
  const event = {
    path: req.path,
    httpMethod: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body),
  };

  const response = await handler(event);
  res.status(response.statusCode).json(JSON.parse(response.body));
});

app.listen(8080, () => {
  console.log('Local Lambda server running on http://localhost:8080');
});
