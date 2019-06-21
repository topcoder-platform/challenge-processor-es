/**
 * Service for challenge Elasticsearch processor.
 */

const Joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')
const config = require('config')

const client = helper.getESClient()

/**
 * Create message in Elasticsearch.
 * @param {Object} message the challenge created message
 */
async function create (message) {
  await client.create({
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.id,
    body: message.payload
  })
}

create.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      id: Joi.string().uuid().required(),
      typeId: Joi.string().uuid().required(),
      track: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().required(),
      challengeSettings: Joi.array().items(Joi.object().keys({
        type: Joi.string().uuid().required(),
        value: Joi.string().required()
      })).unique((a, b) => a.type === b.type),
      timelineTemplateId: Joi.string().uuid().required(),
      phases: Joi.array().items(Joi.object().keys({
        id: Joi.string().uuid().required(),
        name: Joi.string().required(),
        description: Joi.string(),
        predecessor: Joi.string().uuid(),
        isActive: Joi.boolean().required(),
        duration: Joi.number().positive().required()
      })).min(1).required(),
      prizeSets: Joi.array().items(Joi.object().keys({
        type: Joi.string().required(),
        description: Joi.string(),
        prizes: Joi.array().items(Joi.object().keys({
          description: Joi.string(),
          type: Joi.string().required(),
          value: Joi.number().positive().required()
        })).min(1).required()
      })).min(1).required(),
      reviewType: Joi.string().required(),
      tags: Joi.array().items(Joi.string().required()).min(1).required(), // tag names
      projectId: Joi.number().integer().positive().required(),
      forumId: Joi.number().integer().positive(),
      legacyId: Joi.number().integer().positive(),
      status: Joi.string().required(),
      groups: Joi.array().items(Joi.string()), // group names
      created: Joi.date().required(),
      createdBy: Joi.string().required() // user handle
    }).unknown(true).required()
  }).required()
}

/**
 * Update message in Elasticsearch.
 * @param {Object} message the challenge updated message
 */
async function update (message) {
  // it will do full or partial update
  await client.update({
    index: config.get('esConfig.ES_INDEX'),
    type: config.get('esConfig.ES_TYPE'),
    id: message.payload.id,
    body: { doc: message.payload }
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
  create,
  update
}

logger.buildService(module.exports)
