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
    }
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

// Exports
module.exports = {
  update
}

logger.buildService(module.exports)
