/*
 * Test data to be used in tests
 */

const uuid = require('uuid/v4')

const challengeId = uuid()

const notFoundId = uuid()

const challengeCreatedMessage = {
  topic: 'challenge.action.created',
  originator: 'challenge-api',
  timestamp: '2019-02-03T00:00:00',
  'mime-type': 'application/json',
  payload: {
    id: challengeId,
    typeId: uuid(),
    track: 'Code',
    name: 'test challenge',
    description: 'some description',
    challengeSettings: [{ type: uuid(), value: 'value' }],
    timelineTemplateId: uuid(),
    phases: [{
      id: uuid(),
      name: 'review',
      description: 'review phase',
      isActive: true,
      duration: 10000
    }],
    prizeSets: [{
      type: 'Challenge prizes',
      description: 'prize desc',
      prizes: [{
        description: 'winner prize',
        type: 'winning prize',
        value: 500
      }]
    }],
    reviewType: 'code review',
    tags: ['code'],
    projectId: 12345,
    forumId: 123123,
    status: 'Active',
    groups: ['group1', 'group2'],
    created: '2019-02-03T00:00:00',
    createdBy: 'admin'
  }
}

const challengeUpdatedMessage = {
  topic: 'challenge.action.updated',
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
    phases: [{
      id: uuid(),
      name: 'review',
      description: 'review phase 2',
      isActive: true,
      duration: 20000
    }],
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
  topic: 'challenge.action.updated',
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

module.exports = {
  challengeId,
  notFoundId,
  challengeCreatedMessage,
  challengeUpdatedMessage,
  challengePartiallyUpdatedMessage
}
