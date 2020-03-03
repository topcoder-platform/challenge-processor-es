/**
 * Configuration file to be used while running tests
 */

module.exports = {
  esConfig: {
    HOST: process.env.ES_HOST || 'localhost:9200',
    ES_INDEX: process.env.ES_INDEX_TEST || 'challenge-test',
    ES_TYPE: process.env.ES_TYPE_TEST || '_doc' // ES 6.x accepts only 1 Type per index and it's mandatory to define it
  }
}
