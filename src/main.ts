import * as core from '@actions/core'
import checkQualityGate from './checkQualityGate'
import { json } from 'stream/consumers'

async function run(): Promise<void> {
  try {
    const url = core.getInput('sonarUrl', { required: true })
    const token = core.getInput('sonarToken', { required: true })
    const reportFile = core.getInput('sonarToken')

    await checkQualityGate(url, token, reportFile)
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    core.setFailed(message)
  }
}

run()
