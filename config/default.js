/**
 * The default configuration file.
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING ? process.env.DISABLE_LOGGING === 'true' : false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'challenge-processor-es',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  UPDATE_DATA_TOPIC: process.env.UPDATE_DATA_TOPIC || 'challenge.notification.update',
  CREATE_RESOURCE_TOPIC: process.env.CREATE_RESOURCE_TOPIC || 'challenge.action.resource.create',
  DELETE_RESOURCE_TOPIC: process.env.DELETE_RESOURCE_TOPIC || 'challenge.action.resource.delete',
  CREATE_SUBMISSION_TOPIC: process.env.CREATE_SUBMISSION_TOPIC || 'submission.notification.create',
  DELETE_SUBMISSION_TOPIC: process.env.DELETE_SUBMISSION_TOPIC || 'submission.notification.delete',

  // challenge registrant role id, if not provided then any role is considered as registrant
  REGISTRANT_ROLE_ID: process.env.REGISTRANT_ROLE_ID,

  esConfig: {
    HOST: process.env.ES_HOST || 'localhost:9200',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1', // AWS Region to be used if we use AWS ES
    API_VERSION: process.env.ES_API_VERSION || '6.3',
    ES_INDEX: process.env.ES_INDEX || 'challenge',
    ES_TYPE: process.env.ES_TYPE || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  }
}
