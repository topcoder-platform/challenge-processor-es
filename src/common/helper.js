/**
 * Contains generic helper methods
 */

const AWS = require('aws-sdk')
const config = require('config')
const elasticsearch = require('elasticsearch')

AWS.config.region = config.get('esConfig.AWS_REGION')
// ES Client mapping
const esClients = {}

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

module.exports = {
  getESClient
}
