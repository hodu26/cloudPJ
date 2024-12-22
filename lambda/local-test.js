const AWSMock = require('aws-sdk-mock');
const { handler } = require('./lambda-s3_db'); // Lambda 코드 파일  ( lambda-s3_db, lambda-db )

// Mock SNS 서비스
AWSMock.mock('SNS', 'publish', (params, callback) => {
  console.log('SNS Mocked:', params);
  callback(null, { MessageId: '12345' });
});

// Mock RDS for DocumentDB if needed
AWSMock.mock('RDS', 'describeDBClusters', (params, callback) => {
  console.log('RDS Mocked:', params);
  callback(null, { DBClusters: [{ Status: 'available' }] });
});

// Test Lambda function
const testEvent = {
  path: '/courses',
  httpMethod: 'GET',
  headers: { Authorization: 'mock-jwt-token' },
  body: null,
};

handler(testEvent).then((response) => {
  console.log('Lambda Response:', response);
  AWSMock.restore(); // Clean up mocks
});
