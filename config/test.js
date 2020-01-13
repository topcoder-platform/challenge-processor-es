/**
 * Configuration file to be used while running tests
 */

module.exports = {
  // challenge registrant role id, if not provided then any role is considered as registrant
  REGISTRANT_ROLE_ID: process.env.REGISTRANT_ROLE_ID || '173803d3-019e-4033-b1cf-d7205c7f773a',

  esConfig: {
    HOST: process.env.ES_HOST || 'localhost:9200',
    ES_INDEX: process.env.ES_INDEX_TEST || 'challenge-test',
    ES_TYPE: process.env.ES_TYPE_TEST || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  }
}
