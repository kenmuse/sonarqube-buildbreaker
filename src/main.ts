import * as core from '@actions/core'
import checkQualityGate from './checkQualityGate'

async function run(): Promise<void> {
  try {
    const url = core.getInput('sonarUrl')
    const token = core.getInput('sonarToken')

    await checkQualityGate(url, token)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
