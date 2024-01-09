/**
 * Service for challenge Elasticsearch processor.
 */

const _ = require('lodash')
const Joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')
const config = require('config')
const moment = require('moment')

Joi.optionalId = () => Joi.string().uuid()
Joi.id = () => Joi.optionalId().required()

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
    logger.debug('Doc has phases', doc.phases.length)
    doc.currentPhase = message.payload.phases.slice().reverse().find(phase => phase.isOpen)
    let startDate = doc.startDate
    if (!startDate) {
      const challenge = await client.get(request)
      request.version = challenge.version
      startDate = challenge._source.startDate
      logger.debug('Doc Phase had no start start date', startDate)
    }
    if (startDate) {
      doc.endDate = getChallengeEndDate(doc.phases, startDate)
      logger.debug('Updating End Date', doc.endDate)
    }
    const registrationPhase = _.find(doc.phases, p => p.name === 'Registration')
    const submissionPhase = _.find(doc.phases, p => p.name === 'Submission')
    doc.currentPhaseNames = _.map(_.filter(doc.phases, p => p.isOpen === true), 'name')
    if (registrationPhase) {
      doc.registrationStartDate = registrationPhase.actualStartDate || registrationPhase.scheduledStartDate
      doc.registrationEndDate = registrationPhase.actualEndDate || registrationPhase.scheduledEndDate
    }
    if (submissionPhase) {
      doc.submissionStartDate = submissionPhase.actualStartDate || submissionPhase.scheduledStartDate
      doc.submissionEndDate = submissionPhase.actualEndDate || submissionPhase.scheduledEndDate
    }
  }
  logger.debug('Updating ES', doc)
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
    key: Joi.string().allow(null),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      legacy: Joi.object().keys({
        track: Joi.string().required(),
        reviewType: Joi.string().required(),
        confidentialityType: Joi.string(),
        directProjectId: Joi.number(),
        forumId: Joi.number().integer().positive()
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
        name: Joi.string(),
        duration: Joi.number().positive().required(),
        scheduledStartDate: Joi.date(),
        scheduledEndDate: Joi.date(),
        actualStartDate: Joi.date(),
        actualEndDate: Joi.date()
      }).unknown(true)),
      prizeSets: Joi.array().items(Joi.object().keys({
        type: Joi.string().required(),
        description: Joi.string(),
        prizes: Joi.array().items(Joi.object().keys({
          description: Joi.string(),
          type: Joi.string().required(),
          value: Joi.number().positive().required()
        })).min(1).required()
      })),
      discussions: Joi.array().items(Joi.object().keys({
        id: Joi.id(),
        name: Joi.string().required(),
        type: Joi.string().required().valid('challenge'),
        provider: Joi.string().required(),
        url: Joi.string(),
        options: Joi.array().items(Joi.object())
      })).allow(null),
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
  // get resource count
  logger.debug(`Getting Registrant Info - URL ${config.RESOURCES_API_URL}/count Challenge ID: ${challengeId} Role ID: ${config.REGISTRANT_RESOURCE_ROLE_ID}`)
  const resourceCount = await helper.getData(`${config.RESOURCES_API_URL}/count`, { challengeId, roleId: config.REGISTRANT_RESOURCE_ROLE_ID })
  const numOfRegistrants = _.get(resourceCount, config.REGISTRANT_RESOURCE_ROLE_ID, 0)
  logger.debug(`Update Number of Registrants: ${JSON.stringify(resourceCount)} Length: ${numOfRegistrants}`)
  // update challenge's number of registrants, only update changed fields to improve performance
  await client.update({
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: challengeId,
    body: {
      doc: { numOfRegistrants }
    },
    refresh: 'true'
  })
}

/**
 * Handle create resource message.
 * @param {Object} message the challenge resource created message
 */
async function createResource (message) {
  if (message.payload.roleId === config.REGISTRANT_RESOURCE_ROLE_ID) {
    await updateNumberOfRegistrants(message.payload.challengeId)
  }
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
      legacyId: Joi.number().integer().positive().allow(null),
      created: Joi.date().required(),
      createdBy: Joi.string().required(),
      updated: Joi.date(),
      updatedBy: Joi.string(),
      roleId: Joi.string().uuid().required()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle update resource message.
 * @param {Object} message the challenge resource updated message
 */
async function updateResource (message) {
  if (message.payload.roleId === config.REGISTRANT_RESOURCE_ROLE_ID) {
    await updateNumberOfRegistrants(message.payload.challengeId)
  }
}

updateResource.schema = createResource.schema

/**
 * Handle remove resource message.
 * @param {Object} message the challenge resource removed message
 */
async function removeResource (message) {
  logger.debug(`Remove Resource Call ${JSON.stringify(message)}`)
  if (message.payload.roleId === config.REGISTRANT_RESOURCE_ROLE_ID) {
    await updateNumberOfRegistrants(message.payload.challengeId)
  }
}

removeResource.schema = createResource.schema

/**
 * Update submissions data of given challenge.
 * @param {String} challengeId the challenge id
 */
async function updateSubmissionsData (challengeId, type) {
  const v5challengeId = await helper.getV5ChallengeId(challengeId)
  logger.debug(`Update Submissions Data Challenge UUID ${v5challengeId}`)
  const submissionCount = await helper.getData(`${config.SUBMISSIONS_API_URL}/${v5challengeId}/count`)

  let numOfSubmissions = submissionCount[config.CONTEST_SUBMISSION_TYPE] != null ? _.get(submissionCount, config.CONTEST_SUBMISSION_TYPE, 0) : _.get(submissionCount, config.CHALLENGE_SUBMISSION_TYPE, 0)
  let numOfCheckpointSubmissions = _.get(submissionCount, config.CHECKPOINT_SUBMISSION_TYPE, 0)

  if (type && numOfSubmissions === 0 && numOfCheckpointSubmissions === 0) {
    if (type === config.CONTEST_SUBMISSION_TYPE || type === config.CHALLENGE_SUBMISSION_TYPE) {
      numOfSubmissions = 1
    } else if (type === config.CHECKPOINT_SUBMISSION_TYPE) {
      numOfCheckpointSubmissions = 1
    }
  }

  // update challenge's submissions data, only update changed fields to improve performance
  const doc = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: v5challengeId,
    body: {
      doc: {
        numOfSubmissions,
        numOfCheckpointSubmissions
      }
    }
  }
  await client.update(doc)
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
  await updateSubmissionsData(message.payload.v5ChallengeId, message.payload.type)
}

createSubmission.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      resource: Joi.string().required(),
      v5ChallengeId: intOrUUID().required()
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

  await updateSubmissionsData(message.payload.v5ChallengeId, message.payload.type)
}

updateSubmission.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      resource: Joi.string().required(),
      v5ChallengeId: intOrUUID().required()
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
    // This still can give legacy challenge id for old submissions
    challengeId = submission.v5ChallengeId
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

// logger.buildService(module.exports)
