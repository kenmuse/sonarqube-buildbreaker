import * as core from '@actions/core'
import Endpoint from './Endpoint'
import {getJSON} from './helpers/request'

interface IMetric {
  custom?: boolean
  decimalScale?: number
  description?: string
  direction?: number
  domain?: string
  hidden?: boolean
  key: string
  name: string
  qualitative?: boolean
  type: string
}

interface MetricsResponse {
  metrics: IMetric[]
  p: number
  ps: number
  total: number
}

export default class Metrics {
  constructor(public metrics: IMetric[]) {}

  static async getAllMetrics(endpoint: Endpoint): Promise<Metrics | undefined> {
    try {
      return await inner()
    } catch (err) {
      core.error(`[SQ] Could not fetch metrics`)
      if (err && err instanceof Error) {
        core.error(err.message)
      } else if (err) {
        core.error(JSON.stringify(err))
      }
      return undefined
    }

    async function inner(
      data: {f?: string; p?: number; ps?: number} = {f: 'name', ps: 500},
      prev?: MetricsResponse
    ): Promise<Metrics> {
      const response = await getJSON<MetricsResponse>(
        endpoint,
        '/api/metrics/search',
        data
      )

      const result = prev
        ? prev.metrics.concat(response.metrics)
        : response.metrics
      if (response.p * response.ps > response.total) {
        return new Metrics(result)
      }
      return inner({...data, p: response.p + 1}, {...response, metrics: result})
    }
  }
}
