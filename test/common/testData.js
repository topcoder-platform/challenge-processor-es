/*
 * Test data to be used in tests
 */

const uuid = require('uuid/v4')

const challengeId = uuid()

const notFoundId = uuid()

const roleId = '173803d3-019e-4033-b1cf-d7205c7f773a'

const challengeUpdatedMessage = {
  topic: 'challenge.notification.update',
  originator: 'challenge-api',
  timestamp: '2019-02-04T01:01:00',
  'mime-type': 'application/json',
  payload: {
    id: challengeId,
    typeId: uuid(),
    track: 'Code',
    name: 'test challenge 2',
    description: 'some description 2',
    challengeSettings: [{ type: uuid(), value: 'value 2' }],
    timelineTemplateId: uuid(),
    prizeSets: [{
      type: 'Challenge prizes',
      description: 'prize desc 2',
      prizes: [{
        description: 'winner prize 2',
        type: 'winning prize 2',
        value: 800
      }]
    }],
    reviewType: 'code review',
    tags: ['nodejs'],
    projectId: 121212,
    forumId: 456456,
    legacyId: 898989,
    status: 'Active',
    attachments: [{
      id: uuid(),
      fileSize: 123456,
      fileName: 'test.txt',
      challengeId
    }],
    groups: ['group1', 'group3'],
    created: '2019-02-03T00:00:00',
    createdBy: 'admin',
    updated: '2019-02-04T01:01:00',
    updatedBy: 'user'
  }
}

const challengePartiallyUpdatedMessage = {
  topic: 'challenge.notification.update',
  originator: 'challenge-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    id: challengeId,
    name: 'test challenge 3',
    description: 'some description 3',
    timelineTemplateId: uuid(),
    prizeSets: [{
      type: 'Challenge prizes',
      description: 'prize desc 3',
      prizes: [{
        description: 'winner prize 3',
        type: 'winning prize 3',
        value: 900
      }]
    }],
    groups: ['group4'],
    updated: '2019-01-02T00:00:00',
    updatedBy: 'user'
  }
}

const createResourceMessage = {
  topic: 'challenge.action.resource.create',
  originator: 'resource-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    id: uuid(),
    challengeId,
    memberId: '123456',
    memberHandle: 'test',
    roleId
  }
}

const removeResourceMessage = {
  topic: 'challenge.action.resource.delete',
  originator: 'resource-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: createResourceMessage.payload
}

const createSubmissionMessage = {
  topic: 'submission.notification.create',
  originator: 'submission-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    resource: 'submission',
    id: uuid(),
    type: 'ContestSubmission',
    url: 'http://test.com/submission/111',
    memberId: '123456',
    challengeId,
    created: '2019-02-03T01:01:00',
    createdBy: 'test'
  }
}

const removeSubmissionMessage = {
  topic: 'submission.notification.delete',
  originator: 'submission-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: createSubmissionMessage.payload
}

module.exports = {
  challengeId,
  notFoundId,
  challengeUpdatedMessage,
  challengePartiallyUpdatedMessage,
  createResourceMessage,
  removeResourceMessage,
  createSubmissionMessage,
  removeSubmissionMessage
}
