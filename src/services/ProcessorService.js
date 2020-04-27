/**
 * Service for challenge Elasticsearch processor.
 */

const _ = require('lodash')
const Joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')
const config = require('config')
const moment = require('moment')

const client = helper.getESClient()

const intOrUUID = () => Joi.alternatives().try(Joi.number().integer().min(1), Joi.string().uuid())

/**
 * Get the end date of a challenge
 * @param {Array} phases the challenge phases
 * @param {Object} startDate the challenge start date to use as a starting point
 * @returns {String} the challenge end date string
 */
function getChallengeEndDate (phases, startDate) {
  const map = phases.reduce((obj, elem) => {
    obj[elem.id] = elem
    return obj
  }, {})
  const result = moment(startDate)
  let phase = phases[phases.length - 1]
  while (phase) {
    result.add(phase.duration || 0, 'seconds')
    phase = phase.predecessor && map[phase.predecessor]
  }
  return result.toDate().toISOString()
}

/**
 * Update message in Elasticsearch.
 * @param {Object} message the challenge updated message
 */
async function update (message) {
  logger.info('Before processing message')
  // it will do full or partial update
  // `currentPhase` is automatically set to the last phase object with isOpen == true
  // `endDate` is calculated with Optimistic Concurrency Control:
  // https://www.elastic.co/guide/en/elasticsearch/guide/master/optimistic-concurrency-control.html
  const doc = message.payload
  const request = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.id
  }
  if (doc.phases && doc.phases.length > 0) {
    doc.currentPhase = message.payload.phases.slice().reverse().find(phase => phase.isOpen)
    let startDate = doc.startDate
    if (!startDate) {
      const challenge = await client.get(request)
      request.version = challenge.version
      startDate = challenge._source.startDate
    }
    if (startDate) {
      doc.endDate = getChallengeEndDate(doc.phases, startDate)
    }
  }
  await client.update({
    ...request,
    body: {
      doc: doc
    },
    refresh: 'true'
  })
  logger.info('After processing message')
}

update.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      legacy: Joi.object().keys({
        track: Joi.string().required(),
        reviewType: Joi.string().required(),
        confidentialityType: Joi.string(),
        directProjectId: Joi.number(),
        forumId: Joi.number().integer().positive(),
        informixModified: Joi.string()
      }),
      typeId: Joi.string().uuid(),
      name: Joi.string(),
      description: Joi.string(),
      privateDescription: Joi.string(),
      metadata: Joi.array().items(Joi.object().keys({
        name: Joi.string().uuid().required(),
        value: Joi.string().required()
      })).unique((a, b) => a.type === b.type).allow(null),
      timelineTemplateId: Joi.string().uuid(),
      phases: Joi.array().items(Joi.object().keys({
        id: Joi.string().uuid().required(),
        phaseId: Joi.string().uuid().required(),
        predecessor: Joi.string().uuid(),
        isOpen: Joi.boolean(),
        duration: Joi.number().positive().required(),
        scheduledStartDate: Joi.date(),
        scheduledEndDate: Joi.date(),
        actualStartDate: Joi.date(),
        actualEndDate: Joi.date()
      })),
      prizeSets: Joi.array().items(Joi.object().keys({
        type: Joi.string().required(),
        description: Joi.string(),
        prizes: Joi.array().items(Joi.object().keys({
          description: Joi.string(),
          type: Joi.string().required(),
          value: Joi.number().positive().required()
        })).min(1).required()
      })),
      tags: Joi.array().items(Joi.string()), // tag names
      projectId: Joi.number().integer().positive().allow(null),
      legacyId: Joi.number().integer().positive().allow(null),
      status: Joi.string(),
      startDate: Joi.date(),
      attachments: Joi.array().items(Joi.object().keys({
        id: Joi.string().uuid().required(),
        fileSize: Joi.number().integer().positive().required(),
        fileName: Joi.string().required(),
        challengeId: Joi.string().uuid().required()
      })).allow(null),
      terms: Joi.array().items(Joi.string().uuid()).allow(null),
      groups: Joi.array().items(Joi.string()).allow(null), // group names
      created: Joi.date(),
      createdBy: Joi.string(), // user handle
      updated: Joi.date().required(),
      updatedBy: Joi.string().required() // user handle
    }).unknown(true).required()
  }).required()
}

/**
 * Update number of registrants of given challenge.
 * @param {String} challengeId the challenge id
 */
async function updateNumberOfRegistrants (challengeId) {
  // get all challenge resources
  const resources = await helper.getData(config.RESOURCES_API_URL, { challengeId })
  // count registrants
  let count = 0
  _.forEach(resources, (resource) => {
    if (!config.REGISTRANT_RESOURCE_ROLE_ID || config.REGISTRANT_RESOURCE_ROLE_ID === resource.roleId) {
      count += 1
    }
  })

  // update challenge's number of registrants, only update changed fields to improve performance
  await client.update({
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: challengeId,
    body: {
      doc: { numberOfRegistrants: count }
    },
    refresh: 'true'
  })
}

/**
 * Handle create resource message.
 * @param {Object} message the challenge resource created message
 */
async function createResource (message) {
  await updateNumberOfRegistrants(message.payload.challengeId)
}

createResource.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      challengeId: intOrUUID().required(),
      memberId: intOrUUID().required(),
      memberHandle: Joi.string().required(),
      roleId: Joi.string().uuid().required()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle update resource message.
 * @param {Object} message the challenge resource updated message
 */
async function updateResource (message) {
  await updateNumberOfRegistrants(message.payload.challengeId)
}

updateResource.schema = createResource.schema

/**
 * Handle remove resource message.
 * @param {Object} message the challenge resource removed message
 */
async function removeResource (message) {
  await updateNumberOfRegistrants(message.payload.challengeId)
}

removeResource.schema = createResource.schema

/**
 * Update submissions data of given challenge.
 * @param {String} challengeId the challenge id
 */
async function updateSubmissionsData (challengeId) {
  // get all challenge resources
  const resources = await helper.getData(config.RESOURCES_API_URL, { challengeId })
  // get all challenge submissions, all pages are retrieved
  const subs = await helper.getAllPagesData(config.SUBMISSIONS_API_URL, { challengeId })

  // function to find submitter handle by member id among challenge resources
  const getSubmitter = (memberId) => {
    const resource = _.find(resources, (r) => String(r.memberId) === String(memberId))
    if (!resource) {
      // there are some rare cases that submitter resource is not found,
      // e.g. user unregisters a challenge after uploading a submission,
      // in such cases, return null submitter instead of disabling the whole challenge submissions data
      return null
    }
    return resource.memberHandle
  }

  // construct data
  const submissions = []
  const checkpoints = []
  let numberOfSubmissions = 0
  let numberOfSubmitters = 0
  let numberOfCheckpointSubmissions = 0
  const submittersMap = {}

  _.forEach(subs, (sub) => {
    let target
    if (sub.type === config.CONTEST_SUBMISSION_TYPE) {
      target = submissions
      numberOfSubmissions += 1
      // count number of submitters, only contest submissions are considered
      if (!submittersMap[sub.memberId]) {
        numberOfSubmitters += 1
        submittersMap[sub.memberId] = true
      }
    } else if (sub.type === config.CHECKPOINT_SUBMISSION_TYPE) {
      target = checkpoints
      numberOfCheckpointSubmissions += 1
    } else {
      // ignore the submission, it is not type of contest submission or checkpoint submission
      return
    }
    // add submission to submissions or checkpoints
    const record = _.find(target, (item) => String(item.submitterId) === String(sub.memberId))
    if (record) {
      record.submissions.push({
        submissionId: sub.id,
        submissionTime: sub.created
      })
    } else {
      target.push({
        submitter: getSubmitter(sub.memberId),
        submitterId: sub.memberId,
        submissions: [{
          submissionId: sub.id,
          submissionTime: sub.created
        }]
      })
    }
  })

  // update challenge's submissions data, only update changed fields to improve performance
  await client.update({
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: challengeId,
    body: {
      doc: {
        submissions,
        checkpoints,
        numberOfSubmissions,
        numberOfSubmitters,
        numberOfCheckpointSubmissions
      }
    },
    refresh: 'true'
  })
}

/**
 * Handle create submission message.
 * @param {Object} message the challenge submission created message
 */
async function createSubmission (message) {
  if (message.payload.resource !== 'submission') {
    logger.info('Ignore message, it is not of submission resource.')
    return
  }
  await updateSubmissionsData(message.payload.challengeId)
}

createSubmission.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      resource: Joi.string().required(),
      id: Joi.string().uuid().required(),
      type: Joi.string().required(),
      fileType: Joi.string(),
      url: Joi.string().uri(),
      memberId: intOrUUID().required(),
      challengeId: intOrUUID().required(),
      legacySubmissionId: intOrUUID(),
      legacyUploadId: intOrUUID(),
      submissionPhaseId: intOrUUID(),
      created: Joi.date().required(),
      updated: Joi.date(),
      createdBy: Joi.string().required(),
      updatedBy: Joi.string()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle update submission message.
 * @param {Object} message the challenge submission updated message
 */
async function updateSubmission (message) {
  if (message.payload.resource !== 'submission') {
    logger.info('Ignore message, it is not of submission resource.')
    return
  }
  await updateSubmissionsData(message.payload.challengeId)
}

updateSubmission.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      resource: Joi.string().required(),
      id: Joi.string().uuid().required(),
      type: Joi.string().required(),
      url: Joi.string().uri(),
      memberId: intOrUUID().required(),
      challengeId: intOrUUID().required(),
      legacySubmissionId: intOrUUID(),
      legacyUploadId: intOrUUID(),
      submissionPhaseId: intOrUUID()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle remove submission message.
 * @param {Object} message the challenge submission removed message
 */
async function removeSubmission (message) {
  if (message.payload.resource !== 'submission') {
    logger.info('Ignore message, it is not of submission resource.')
    return
  }
  // from the current code of submissions API,
  // the remove submission message doesn't include challengeId, see:
  // https://github.com/topcoder-platform/submissions-api/blob/267ff963ab513cc5db9be965badc5a2a61b92e71/src/services/SubmissionService.js#L619
  // if the payload includes challengeId in future, we will use it, otherwise we will get it by querying submission data
  let challengeId = message.payload.challengeId
  if (!challengeId) {
    // get submission by id
    const submission = await helper.getData(`${config.SUBMISSIONS_API_URL}/${message.payload.id}`)
    challengeId = submission.challengeId
  }
  await updateSubmissionsData(challengeId)
}

removeSubmission.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      resource: Joi.string().required(),
      id: Joi.string().uuid().required()
    }).unknown(true).required()
  }).required()
}

// Exports
module.exports = {
  update,
  createResource,
  updateResource,
  removeResource,
  createSubmission,
  updateSubmission,
  removeSubmission
}

logger.buildService(module.exports)
