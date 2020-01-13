/**
 * Service for challenge Elasticsearch processor.
 */

const Joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')
const config = require('config')
const moment = require('moment')

const client = helper.getESClient()

/**
 * Get the end date of a challenge phase
 * @param {Object} phase the phase object
 * @param {Object} challenge the challenge object
 * @param {Object} startDate the challenge start date to use as a starting point
 */
function getPhaseEndDate (phase, challenge, startDate) {
  const phases = challenge.phases.reduce((obj, elem) => {
    obj[elem.id] = elem
    return obj
  }, {})
  let result = moment(startDate)
  while (phase) {
    result.add(phase.duration, 'hours')
    phase = phase.predecessor && phases[phase.predecessor]
  }
  return result
}

/**
 * Update message in Elasticsearch.
 * @param {Object} message the challenge updated message
 */
async function update (message) {
  // it will do full or partial update
  // `currentPhase` is automatically set to the last phase object with isActive ==  true
  // `endDate` is calculated with Optimistic Concurrency Control: https://www.elastic.co/guide/en/elasticsearch/guide/master/optimistic-concurrency-control.html
  const doc = message.payload
  const request = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.id
  }
  if (doc.phases) {
    doc.currentPhase = message.payload.phases.slice().reverse().find(phase => phase.isActive)
    let startDate = doc.startDate
    if (!startDate) {
      const challenge = await client.get(request)
      request.version = challenge.version
      startDate = challenge._source.startDate
    }
    doc.endDate = getPhaseEndDate(doc.phases[doc.phases.length - 1], doc, startDate).format()
  }
  await client.update({
    ...request,
    body: {
      doc: doc
    },
    refresh: 'true'
  })
}

update.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      typeId: Joi.string().uuid(),
      track: Joi.string(),
      name: Joi.string(),
      description: Joi.string(),
      privateDescription: Joi.string(),
      challengeSettings: Joi.array().items(Joi.object().keys({
        type: Joi.string().uuid().required(),
        value: Joi.string().required()
      })).unique((a, b) => a.type === b.type).allow(null),
      timelineTemplateId: Joi.string().uuid(),
      phases: Joi.array().items(Joi.object().keys({
        id: Joi.string().uuid().required(),
        name: Joi.string().required(),
        description: Joi.string(),
        predecessor: Joi.string().uuid(),
        isActive: Joi.boolean().required(),
        duration: Joi.number().positive().required()
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
      reviewType: Joi.string(),
      tags: Joi.array().items(Joi.string()), // tag names
      projectId: Joi.number().integer().positive(),
      forumId: Joi.number().integer().positive(),
      legacyId: Joi.number().integer().positive().allow(null),
      status: Joi.string(),
      startDate: Joi.date(),
      attachments: Joi.array().items(Joi.object().keys({
        id: Joi.string().uuid().required(),
        fileSize: Joi.number().integer().positive().required(),
        fileName: Joi.string().required(),
        challengeId: Joi.string().uuid().required()
      })).allow(null),
      groups: Joi.array().items(Joi.string()).allow(null), // group names
      created: Joi.date(),
      createdBy: Joi.string(), // user handle
      updated: Joi.date().required(),
      updatedBy: Joi.string().required() // user handle
    }).unknown(true).required()
  }).required()
}

/**
 * Handle create resource message.
 * @param {Object} message the challenge resource created message
 */
async function createResource (message) {
  if (config.REGISTRANT_ROLE_ID && config.REGISTRANT_ROLE_ID !== message.payload.roleId) {
    logger.info('Ignore message , it is not of registrant role.')
    return
  }

  // get existing challenge
  const request = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.challengeId
  }
  const challenge = await client.getSource(request)
  if (!challenge.numOfRegistrants) {
    challenge.numOfRegistrants = 0
  }
  challenge.numOfRegistrants += 1

  // update challenge
  await client.update({
    ...request,
    body: {
      doc: challenge
    },
    refresh: 'true'
  })
}

createResource.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      challengeId: Joi.string().required(),
      memberId: Joi.string().required(),
      memberHandle: Joi.string().required(),
      roleId: Joi.string().uuid().required()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle remove resource message.
 * @param {Object} message the challenge resource removed message
 */
async function removeResource (message) {
  if (config.REGISTRANT_ROLE_ID && config.REGISTRANT_ROLE_ID !== message.payload.roleId) {
    logger.info('Ignore message , it is not of registrant role.')
    return
  }

  // get existing challenge
  const request = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.challengeId
  }
  const challenge = await client.getSource(request)
  if (!challenge.numOfRegistrants) {
    challenge.numOfRegistrants = 0
  }
  challenge.numOfRegistrants -= 1
  if (challenge.numOfRegistrants < 0) {
    throw new Error(`Negative number of registrants for challenge ${message.payload.challengeId}`)
  }

  // update challenge
  await client.update({
    ...request,
    body: {
      doc: challenge
    },
    refresh: 'true'
  })
}

removeResource.schema = createResource.schema

/**
 * Handle create submission message.
 * @param {Object} message the challenge submission created message
 */
async function createSubmission (message) {
  if (message.payload.resource !== 'submission') {
    logger.info('Ignore message , it is not of submission resource.')
    return
  }

  // get existing challenge
  const request = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.challengeId
  }
  const challenge = await client.getSource(request)
  if (!challenge.numOfSubmissions) {
    challenge.numOfSubmissions = 0
  }
  challenge.numOfSubmissions += 1

  // update challenge
  await client.update({
    ...request,
    body: {
      doc: challenge
    },
    refresh: 'true'
  })
}

createSubmission.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      resource: Joi.string().required(),
      id: Joi.string().required(),
      type: Joi.string().required(),
      url: Joi.string().uri(),
      memberId: Joi.string().required(),
      challengeId: Joi.string().required(),
      created: Joi.date().required(),
      updated: Joi.date(),
      createdBy: Joi.string().required(),
      updatedBy: Joi.string()
    }).unknown(true).required()
  }).required()
}

/**
 * Handle remove submission message.
 * @param {Object} message the challenge submission removed message
 */
async function removeSubmission (message) {
  if (message.payload.resource !== 'submission') {
    logger.info('Ignore message , it is not of submission resource.')
    return
  }

  // get existing challenge
  const request = {
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.challengeId
  }
  const challenge = await client.getSource(request)
  if (!challenge.numOfSubmissions) {
    challenge.numOfSubmissions = 0
  }
  challenge.numOfSubmissions -= 1
  if (challenge.numOfSubmissions < 0) {
    throw new Error(`Negative number of submissions for challenge ${message.payload.challengeId}`)
  }

  // update challenge
  await client.update({
    ...request,
    body: {
      doc: challenge
    },
    refresh: 'true'
  })
}

removeSubmission.schema = createSubmission.schema

// Exports
module.exports = {
  update,
  createResource,
  removeResource,
  createSubmission,
  removeSubmission
}

logger.buildService(module.exports)
