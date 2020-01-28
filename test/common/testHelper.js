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
 * @param {Object} obj1 the object 1
 * @param {Object} obj2 the object 2
 * @param {Array} ignoredFields the ignored fields
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

/**
 * Expect given two phases are the same
 * @param {Object} phase1 the phase 1
 * @param {Object} phase2 the phase 2
 */
function expectSamePhase (phase1, phase2) {
  expectObj(phase1, phase2, ['scheduledStartDate', 'scheduledEndDate', 'actualStartDate', 'actualEndDate'])
  expect(new Date(phase1.scheduledStartDate).getTime()).to.equal(new Date(phase2.scheduledStartDate).getTime())
  expect(new Date(phase1.scheduledEndDate).getTime()).to.equal(new Date(phase2.scheduledEndDate).getTime())
  expect(new Date(phase1.actualStartDate).getTime()).to.equal(new Date(phase2.actualStartDate).getTime())
  expect(new Date(phase1.actualEndDate).getTime()).to.equal(new Date(phase2.actualEndDate).getTime())
}

module.exports = {
  getESData,
  expectObj,
  expectSamePhase
}
