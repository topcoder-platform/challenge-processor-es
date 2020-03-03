/*
 * Test data to be used in tests
 */

const _ = require('lodash')
const uuid = require('uuid/v4')

const challengeId = '7b37a31e-484c-4d1e-aa9f-cfd6656e11d8'

const submissionId = uuid()
const notFoundId = uuid()

const phase1Id = uuid()

const phase2Id = uuid()

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
    phases: [{
      id: phase1Id,
      phaseId: uuid(),
      isOpen: true,
      duration: 100,
      scheduledStartDate: new Date(),
      scheduledEndDate: new Date(),
      actualStartDate: new Date(),
      actualEndDate: new Date()
    }, {
      id: phase2Id,
      phaseId: uuid(),
      predecessor: phase1Id,
      isOpen: true,
      duration: 200,
      scheduledStartDate: new Date(),
      scheduledEndDate: new Date(),
      actualStartDate: new Date(),
      actualEndDate: new Date()
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
    legacyId: 898989,
    status: 'Active',
    attachments: [{
      id: uuid(),
      fileSize: 123456,
      fileName: 'test.txt',
      challengeId
    }],
    groups: ['group1', 'group3'],
    startDate: new Date(),
    created: '2019-02-03T00:00:00',
    createdBy: 'admin',
    updated: '2019-02-04T01:01:00',
    updatedBy: 'user',
    terms: [
      {
        id: 21343,
        agreeabilityType: 'DocuSignable',
        title: 'Competition Non-Disclosure Agreement',
        url: '',
        templateId: '0c5b7081-1fff-4484-a20f-824c97a03b9b'
      },
      {
        id: 20723,
        agreeabilityType: 'Non-electronically-agreeable',
        title: 'Subcontractor Services Agreement 2009-09-02',
        url: 'http://www.topcoder.com/i/terms/Subcontractor+Services+Agreement+2009-09-02.pdf'
      },
      {
        id: 20645,
        agreeabilityType: 'Electronically-agreeable',
        title: '2008 TCO Marathon Match Competition Official Rules',
        url: 'http://topcoder.com/mm-terms'
      }
    ]
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
    updatedBy: 'user',
    terms: [
      {
        id: 21343,
        agreeabilityType: 'DocuSignable',
        title: 'Competition Non-Disclosure Agreement',
        url: '',
        templateId: '0c5b7081-1fff-4484-a20f-824c97a03b9b'
      }
    ]
  }
}

const createResourceMessage = {
  topic: 'challenge.action.resource.create',
  originator: 'resources-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    id: uuid(),
    challengeId,
    memberId: 123456,
    memberHandle: 'test',
    roleId: uuid()
  }
}

const updateResourceMessage = _.assignIn({}, createResourceMessage, { topic: 'challenge.action.resource.update' })

const removeResourceMessage = _.assignIn({}, createResourceMessage, { topic: 'challenge.action.resource.delete' })

const createSubmissionMessage = {
  topic: 'submission.notification.create',
  originator: 'submissions-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    resource: 'submission',
    id: uuid(),
    type: 'Contest Submission',
    url: 'http://test.com/submission/111',
    memberId: 123456,
    challengeId,
    created: '2019-02-03T01:01:00',
    createdBy: 'test',
    updated: '2019-02-03T01:01:00',
    updatedBy: 'test'
  }
}

const updateSubmissionMessage = {
  topic: 'submission.notification.update',
  originator: 'submissions-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    resource: 'submission',
    id: uuid(),
    type: 'Checkpoint Submission',
    url: 'http://test.com/submission/111',
    memberId: 123456,
    challengeId
  }
}

const removeSubmissionMessage = {
  topic: 'submission.notification.delete',
  originator: 'submissions-api',
  timestamp: '2019-02-03T01:01:00',
  'mime-type': 'application/json',
  payload: {
    resource: 'submission',
    id: submissionId
  }
}

const requiredFields = ['originator', 'timestamp', 'mime-type', 'payload.id', 'payload.challengeId', 'payload.memberId',
  'payload.memberHandle', 'payload.roleId', 'payload.resource', 'payload.type']

const stringFields = ['originator', 'mime-type', 'payload.id', 'payload.memberHandle', 'payload.resource',
  'payload.roleId', 'payload.url', 'payload.type', 'payload.createdBy', 'payload.updatedBy']

const guidFields = ['payload.id', 'payload.roleId']

const dateFields = ['timestamp', 'payload.created']

module.exports = {
  challengeId,
  submissionId,
  notFoundId,
  challengeUpdatedMessage,
  challengePartiallyUpdatedMessage,
  createResourceMessage,
  updateResourceMessage,
  removeResourceMessage,
  createSubmissionMessage,
  updateSubmissionMessage,
  removeSubmissionMessage,
  requiredFields,
  stringFields,
  guidFields,
  dateFields
}
