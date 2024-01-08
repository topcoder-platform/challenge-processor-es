/**
 * The default configuration file.
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING ? process.env.DISABLE_LOGGING === 'true' : false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

  // used to get M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder-dev.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'challenge-processor-es',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  UPDATE_DATA_TOPIC: process.env.UPDATE_DATA_TOPIC || 'challenge.notification.update',
  CREATE_RESOURCE_TOPIC: process.env.CREATE_RESOURCE_TOPIC || 'challenge.action.resource.create',
  UPDATE_RESOURCE_TOPIC: process.env.UPDATE_RESOURCE_TOPIC || 'challenge.action.resource.update',
  DELETE_RESOURCE_TOPIC: process.env.DELETE_RESOURCE_TOPIC || 'challenge.action.resource.delete',
  CREATE_SUBMISSION_TOPIC: process.env.CREATE_SUBMISSION_TOPIC || 'submission.notification.create',
  UPDATE_SUBMISSION_TOPIC: process.env.UPDATE_SUBMISSION_TOPIC || 'submission.notification.update',
  DELETE_SUBMISSION_TOPIC: process.env.DELETE_SUBMISSION_TOPIC || 'submission.notification.delete',

  // challenge registrant resource role id, if not provided then any resource role is considered as registrant
  REGISTRANT_RESOURCE_ROLE_ID: process.env.REGISTRANT_RESOURCE_ROLE_ID || '732339e7-8e30-49d7-9198-cccf9451e221',
  SUBMISSIONS_API_URL: process.env.SUBMISSIONS_API_URL || 'http://localhost:4000/v5/submissions',
  RESOURCES_API_URL: process.env.RESOURCES_API_URL || 'http://localhost:4000/v5/resources',
  CHALLENGE_API_URL: process.env.CHALLENGE_API_URL || 'http://localhost:4000/v5/challenges',
  CONTEST_SUBMISSION_TYPE: process.env.CONTEST_SUBMISSION_TYPE || 'Contest Submission',
  CHALLENGE_SUBMISSION_TYPE: process.env.CHALLENGE_SUBMISSION_TYPE || 'challengesubmission',
  CHECKPOINT_SUBMISSION_TYPE: process.env.CHECKPOINT_SUBMISSION_TYPE || 'Checkpoint Submission',

  // superagent request timeout in milliseconds
  REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT ? Number(process.env.REQUEST_TIMEOUT) : 20000,

  esConfig: {
    HOST: process.env.ES_HOST || 'localhost:9200',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used if we use AWS ES
    API_VERSION: process.env.ES_API_VERSION || '6.8',
    ES_INDEX: process.env.ES_INDEX || 'challenge',
    ES_TYPE: process.env.ES_TYPE || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  }
}
