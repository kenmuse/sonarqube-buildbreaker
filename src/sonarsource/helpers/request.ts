import * as request from 'request'
import * as core from '@actions/core'
import Endpoint from '../Endpoint'

interface RequestData {
  [x: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

async function get<T>(
  endpoint: Endpoint,
  path: string,
  isJson: boolean,
  query?: RequestData
): Promise<T> {
  core.debug(`[SQ] API GET: '${path}' with query "${JSON.stringify(query)}"`)
  return new Promise<T>((resolve, reject) => {
    const options: request.CoreOptions = {
      auth: {user: endpoint.token}
    }
    if (query) {
      options.qs = query
      options.useQuerystring = true
    }
    request.get(
      {
        method: 'GET',
        baseUrl: endpoint.url,
        uri: path,
        json: isJson,
        ...options
      },
      (error, response, body) => {
        if (error) {
          return logAndReject(
            reject,
            `[SQ] API GET '${path}' failed, error was: ${JSON.stringify(error)}`
          )
        }
        core.debug(
          `Response: ${response.statusCode} Body: "${
            isString(body) ? body : JSON.stringify(body)
          }"`
        )
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return logAndReject(
            reject,
            `[SQ] API GET '${path}' failed, status code was: ${response.statusCode}`
          )
        }
        return resolve(body || (isJson ? {} : ''))
      }
    )
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isString(x: any): boolean {
  return Object.prototype.toString.call(x) === '[object String]'
}

export async function getJSON<T>(
  endpoint: Endpoint,
  path: string,
  query?: RequestData
): Promise<T> {
  core.debug('getJSON')
  core.debug(`endpoint.url: ${endpoint.url}`)
  core.debug(`path: ${path}`)
  core.debug(`query: ${JSON.stringify(query)}`)
  return get<T>(endpoint, path, true, query)
}

function logAndReject(reject: (reason?: Error) => void, errMsg: string): void {
  core.debug(errMsg)
  return reject(new Error(errMsg))
}
