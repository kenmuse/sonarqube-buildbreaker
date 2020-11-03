import * as core from '@actions/core'
import Endpoint from './sonarsource/Endpoint'
import Metrics from './sonarsource/Metrics'
import TaskReport from './sonarsource/TaskReport'
import Analysis from './sonarsource/Analysis'
import Task, {TimeOutReachedError} from './sonarsource/Task'

export default async function checkQualityGateTask(
  url: string,
  token: string
): Promise<void> {
  const endpoint = Endpoint.getEndpoint(url, token)

  const metrics = await Metrics.getAllMetrics(endpoint)

  if (!metrics) {
    core.setFailed('Unable to connect to the SonarCloud metrics API endpoint')
    return
  }

  const timeoutSec = 120
  const taskReports = await TaskReport.createTaskReportsFromFiles(endpoint)

  const analyses = await Promise.all<Analysis>(
    taskReports.map(async taskReport =>
      getReportForTask(taskReport, metrics, endpoint, timeoutSec)
    )
  )

  core.info(`Number of analyses in this build: ${taskReports.length}`)
  core.info(
    `Summary of statusses: ${analyses.map(a => `"${a.status}"`).join(', ')}`
  )

  if (analyses.some(a => a.status === 'ERROR')) {
    core.setFailed(
      `The analysis did not pass the quality gate because because at least one analysis has the status 'ERROR'. Attempting to fail the build!`
    )
  }
}

/**
 * Custom, returns Analysis instead of a string
 * @param taskReport
 * @param metrics
 * @param endpoint
 * @param timeoutSec
 */
export async function getReportForTask(
  taskReport: TaskReport,
  metrics: Metrics,
  endpoint: Endpoint,
  timeoutSec: number
): Promise<Analysis> {
  try {
    const task = await Task.waitForTaskCompletion(
      endpoint,
      taskReport.ceTaskId,
      timeoutSec
    )
    const analysis = await Analysis.getAnalysis({
      analysisId: task.analysisId,
      dashboardUrl: taskReport.dashboardUrl,
      endpoint,
      metrics,
      projectName: task.componentName
    })

    return analysis
  } catch (e) {
    if (e instanceof TimeOutReachedError) {
      core.warning(
        `Task '${taskReport.ceTaskId}' takes too long to complete. Stopping after ${timeoutSec}s of polling. No quality gate will be displayed on build result.`
      )
    }

    throw e
  }
}
