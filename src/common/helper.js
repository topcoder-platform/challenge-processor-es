/**
 * Contains generic helper methods
 */

const AWS = require('aws-sdk')
const config = require('config')
const elasticsearch = require('elasticsearch')
const _ = require('lodash')
const logger = require('./logger')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const superagent = require('superagent')

AWS.config.region = config.get('esConfig.AWS_REGION')
// ES Client mapping
const esClients = {}

/**
 * Get M2M token.
 * @return {String} the M2M token
 */
async function getM2MToken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Get data from given URL with given query parameters.
 * @param {String} url the url to get data
 * @param {Object} query the query parameters
 * @returns {Array|Object} got data
 */
async function getData (url, query) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()

  // get data
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .query(query || {})
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

/**
 * Get all pages data from given URL and query parameters. The query parameters do not include page and perPage.
 * @param {String} url the url to get all pages data
 * @param {Object} query the query parameters
 * @return {Array} all pages data
 */
async function getAllPagesData (url, query) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()

  const perPage = 20
  let page = 1
  let result = []
  while (true) {
    // get current page data
    const res = await superagent
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .query(_.assignIn({ page, perPage }, query || {}))
      .timeout(config.REQUEST_TIMEOUT)
    if (!_.isArray(res.body) || res.body.length === 0) {
      break
    }
    result = _.concat(result, res.body)
    if (res.headers['x-total']) {
      const total = Number(res.headers['x-total'])
      if (page * perPage >= total) {
        break
      }
    }
    // increment page
    page += 1
  }

  return result
}

/**
 * Get ES Client
 * @return {Object} Elastic Host Client Instance
 */
function getESClient () {
  const esHost = config.get('esConfig.HOST')
  if (!esClients['client']) {
    // AWS ES configuration is different from other providers
    if (/.*amazonaws.*/.test(esHost)) {
      esClients['client'] = elasticsearch.Client({
        apiVersion: config.get('esConfig.API_VERSION'),
        hosts: esHost,
        connectionClass: require('http-aws-es'), // eslint-disable-line global-require
        amazonES: {
          region: config.get('esConfig.AWS_REGION'),
          credentials: new AWS.EnvironmentCredentials('AWS')
        }
      })
    } else {
      esClients['client'] = new elasticsearch.Client({
        apiVersion: config.get('esConfig.API_VERSION'),
        hosts: esHost
      })
    }
  }
  return esClients['client']
}

/**
 * Get v5 challenge uuid if the challenge id is legacyId format form
 * @param {String} challengeId Challenge ID
 * @returns {String} Legacy Challenge ID of the given challengeId
 */
async function getV5ChallengeId (challengeId) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId)) {
    return challengeId
  } else {
    logger.debug(`${challengeId} detected as legacyId. Fetching challenge uuid`)
    try {
      const v5challenge = await getData(`${config.CHALLENGE_API_URL}?legacyId=${challengeId}`)
      logger.debug(`Legacy challenge id is ${v5challenge.id} for v5 challenge legacyId ${challengeId}`)
      return v5challenge.id
    } catch (err) {
      logger.error(`Error while accessing ${config.CHALLENGE_API_URL}?legacyId=${challengeId} - ${JSON.stringify(err)}`)
      throw err
    }
  }
}

/**
 * Get legacy challenge id if the challenge id is uuid form
 * @param {String} challengeId Challenge ID
 * @returns {String} Legacy Challenge ID of the given challengeId
 */
async function getLegacyChallengeId (challengeId) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId)) {
    logger.debug(`${challengeId} detected as uuid. Fetching legacy challenge id`)
    try {
      const v5challenge = await getData(`${config.CHALLENGE_API_URL}/${challengeId}`)
      const legacyId = parseInt(v5challenge.legacyId, 10)
      logger.debug(`Legacy challenge id is ${legacyId} for v5 challenge id ${challengeId}`)
      return legacyId
    } catch (err) {
      logger.error(`Error while accessing ${config.CHALLENGEAPI_V5_URL}/${challengeId}`)
      throw err
    }
  }
  return challengeId
}

module.exports = {
  getData,
  getAllPagesData,
  getESClient,
  getV5ChallengeId,
  getLegacyChallengeId
}
