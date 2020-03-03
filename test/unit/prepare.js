/*
 * Setting up Mock for unit tests
 */

// During tests the node env is set to test
process.env.NODE_ENV = 'test'

const _ = require('lodash')
const nock = require('nock')
const prepare = require('mocha-prepare')
const config = require('config')
const URL = require('url')

const { challengeId, submissionId } = require('../common/testData')

// mock ES data
let data

const authUrl = URL.parse(config.AUTH0_URL)
const subApiUrl = URL.parse(config.SUBMISSIONS_API_URL)
const resourceApiUrl = URL.parse(config.RESOURCES_API_URL)

const getLastTwoParts = (path) => {
  const parts = path.split('/')
  const op = parts.pop() || ''
  const id = parts.pop() || ''
  return `${id}/${op}`
}

prepare(function (done) {
  // called before loading of test cases
  nock(/.com|localhost/)
    .persist()
    .filteringPath((path) => getLastTwoParts(path))
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
    .query(true)
    .reply(200)
    .post(getLastTwoParts(authUrl.path))
    .query(true)
    .reply(200, { access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiQ29ubmVjdCBTdXBwb3J0IiwiYWRtaW5pc3RyYXRvciIsInRlc3RSb2xlIiwiYWFhIiwidG9ueV90ZXN0XzEiLCJDb25uZWN0IE1hbmFnZXIiLCJDb25uZWN0IEFkbWluIiwiY29waWxvdCIsIkNvbm5lY3QgQ29waWxvdCBNYW5hZ2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJUb255SiIsImV4cCI6MTY5Mjc5NTIxMSwidXNlcklkIjoiODU0Nzg5OSIsImlhdCI6MTU0OTc5MTYxMSwiZW1haWwiOiJ0amVmdHMrZml4QHRvcGNvZGVyLmNvbSIsImp0aSI6ImY5NGQxZTI2LTNkMGUtNDZjYS04MTE1LTg3NTQ1NDRhMDhmMSJ9.sAku5sLBpfTkq4OANJA-eiZCiOxx4u6U6OgpTlk_OU4' })
    .get(getLastTwoParts(subApiUrl.path))
    .query((q) => !q.page || Number(q.page) <= 1)
    .reply(200, [{
      type: config.CONTEST_SUBMISSION_TYPE,
      id: '1b37a31e-484c-4d1e-aa9f-cfd6656e11d2',
      memberId: 222,
      created: '2019-08-09T12:12:11'
    }, {
      type: config.CONTEST_SUBMISSION_TYPE,
      id: '1b37a31e-484c-4d1e-aa9f-cfd6656e11ab',
      memberId: 222,
      created: '2019-08-09T12:12:12'
    }, {
      type: config.CHECKPOINT_SUBMISSION_TYPE,
      id: '1b37a31e-484c-4d1e-aa9f-cfd6656e11d3',
      memberId: 444,
      created: '2019-08-09T12:12:22'
    }, {
      type: config.CHECKPOINT_SUBMISSION_TYPE,
      id: '1b37a31e-484c-4d1e-aa9f-cfd6656e11d4',
      memberId: 444,
      created: '2019-08-09T12:12:33'
    }])
    .get(getLastTwoParts(subApiUrl.path))
    .query((q) => q.page && Number(q.page) > 1)
    .reply(200, [])
    .get(getLastTwoParts(`${subApiUrl.path}/${submissionId}`))
    .query(true)
    .reply(200, { challengeId })
    .get(getLastTwoParts(resourceApiUrl.path))
    .query(true)
    .reply(200, [{
      memberId: 222,
      memberHandle: 'handle1',
      roleId: config.REGISTRANT_RESOURCE_ROLE_ID
    }, {
      memberId: 444,
      memberHandle: 'handle2',
      roleId: config.REGISTRANT_RESOURCE_ROLE_ID
    }])
    .get(() => true)
    .query(true)
    .reply(404)
    .post(() => true)
    .query(true)
    .reply(404)
    .put(() => true)
    .query(true)
    .reply(404)
    .delete(() => true)
    .query(true)
    .reply(404)
  done()
}, function (done) {
  // called after all test completes (regardless of errors)
  nock.cleanAll()
  done()
})
