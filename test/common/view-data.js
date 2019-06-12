/**
 * This is used to view Elasticsearch data of given id of configured index type in configured index.
 * Usage:
 * node test/common/view-data {elasticsearch-id}
 */
const logger = require('../../src/common/logger')
const testHelper = require('./testHelper')

if (process.argv.length < 3) {
  logger.error('Missing argument for Elasticsearch id.')
  process.exit()
}

const viewData = async () => {
  const data = await testHelper.getESData(process.argv[2])
  logger.info('Elasticsearch data:')
  logger.info(JSON.stringify(data, null, 4))
}

viewData().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  if (e.statusCode === 404) {
    logger.info('The data is not found.')
  } else {
    logger.logFullError(e)
  }
  process.exit()
})
