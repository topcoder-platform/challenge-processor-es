/*
 * Setting up Mock for unit tests
 */

// During tests the node env is set to test
process.env.NODE_ENV = 'test'

const _ = require('lodash')
const nock = require('nock')
const prepare = require('mocha-prepare')
const { challengeId } = require('../common/testData')

// mock ES data
let data

prepare(function (done) {
  // called before loading of test cases
  nock(/.com|localhost/)
    .persist()
    .filteringPath((path) => {
      const parts = path.split('/')
      const op = parts.pop()
      const id = parts.pop()
      return `${id}/${op}`
    })
    .get(`${challengeId}/_source`)
    .query(true)
    .reply(() => {
      if (data) {
        return [200, data]
      } else {
        return [404, {}]
      }
    })
    .post(`${challengeId}/_create`)
    .query(true)
    .reply((uri, requestBody) => {
      if (data) {
        return [409, {}]
      } else {
        data = requestBody
        return [200, data]
      }
    })
    .post(`${challengeId}/_update`)
    .query(true)
    .reply((uri, requestBody) => {
      if (data) {
        _.assignIn(data, requestBody.doc)
        return [200, data]
      } else {
        return [404, {}]
      }
    })
    .delete(`_doc/${challengeId}`)
    .reply(200)
    .get(() => true)
    .query(true)
    .reply(404)
    .post(() => true)
    .query(true)
    .reply(404)
  done()
}, function (done) {
  // called after all test completes (regardless of errors)
  nock.cleanAll()
  done()
})
