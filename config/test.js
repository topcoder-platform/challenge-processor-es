/**
 * Configuration file to be used while running tests
 */

module.exports = {
  osConfig: {
    HOST: process.env.OS_HOST || 'localhost:9200',
    OS_INDEX: process.env.OS_INDEX_TEST || 'challenge-test',
  }
}
