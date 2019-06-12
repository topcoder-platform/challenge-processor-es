/**
 * Contains helper method for tests
 */

const _ = require('lodash')
const config = require('config')
const helper = require('../../src/common/helper')
const expect = require('chai').expect

const client = helper.getESClient()

/**
 * Get elastic search data.
 * @param {String} id the Elastic search data id
 * @returns {Object} the elastic search data of id of configured index type in configured index
 */
async function getESData (id) {
  return client.getSource({
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id
  })
}

/**
 * Expect given objects are equal, ignoring some fields if provided.
 * @param {String} id the Elastic search data id
 * @returns {Object} the elastic search data of id of configured index type in configured index
 */
function expectObj (obj1, obj2, ignoredFields) {
  let o1 = obj1
  let o2 = obj2
  if (ignoredFields) {
    o1 = _.omit(obj1, ignoredFields)
    o2 = _.omit(obj2, ignoredFields)
  }
  expect(_.isEqual(o1, o2)).to.equal(true)
}

module.exports = {
  getESData,
  expectObj
}
