import * as path from 'path'
import * as fs from 'fs-extra'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import Endpoint from './Endpoint'

export const REPORT_TASK_NAME = 'report-task.txt'

interface ITaskReport {
  ceTaskId: string
  ceTaskUrl?: string
  dashboardUrl?: string
  projectKey: string
  serverUrl: string
}

export default class TaskReport {
  private readonly report: ITaskReport
  constructor(report: Partial<ITaskReport>) {
    for (const field of ['projectKey', 'ceTaskId', 'serverUrl']) {
      if (!report[field as keyof ITaskReport]) {
        throw TaskReport.throwMissingField(field)
      }
    }
    this.report = report as ITaskReport
  }

  get ceTaskId(): string {
    return this.report.ceTaskId
  }

  get dashboardUrl(): string | undefined {
    return this.report.dashboardUrl
  }

  static async findTaskFileReport(): Promise<string[]> {
    const taskReportGlob = path.join(
      '.sonarqube',
      'out',
      '.sonar',
      '**',
      REPORT_TASK_NAME
    )
    const globber = await glob.create(taskReportGlob)
    const taskReportGlobResult = await globber.glob()

    core.debug(
      `[SQ] Searching for ${taskReportGlob} - found ${taskReportGlobResult.length} file(s)`
    )
    return taskReportGlobResult
  }

  static async createTaskReportsFromFiles(
    endpoint: Endpoint,
    filePaths?: string[]
  ): Promise<TaskReport[]> {
    filePaths = filePaths || (await TaskReport.findTaskFileReport())
    return await Promise.all(
      filePaths.map(async filePath => {
        if (!filePath) {
          return Promise.reject(
            TaskReport.throwInvalidReport(
              `[SQ] Could not find '${REPORT_TASK_NAME}'.` +
                ` Possible cause: the analysis did not complete successfully.`
            )
          )
        }
        core.debug(`[SQ] Read Task report file: ${filePath}`)

        try {
          await fs.access(filePath, fs.constants.R_OK)
        } catch (err) {
          TaskReport.throwInvalidReport(
            `[SQ] Task report not found at: ${filePath}`
          )
        }

        return this.parseReportFile(filePath)
      })
    )
  }

  private static async parseReportFile(filePath: string): Promise<TaskReport> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')

      core.debug(`[SQ] Parse Task report file: ${fileContent}`)
      if (!fileContent || fileContent.length <= 0) {
        throw TaskReport.throwInvalidReport(
          `[SQ] Error reading file: ${fileContent}`
        )
      }

      try {
        const settings = TaskReport.createTaskReportFromString(fileContent)
        const taskReport = new TaskReport({
          ceTaskId: settings.get('ceTaskId'),
          ceTaskUrl: settings.get('ceTaskUrl'),
          dashboardUrl: settings.get('dashboardUrl'),
          projectKey: settings.get('projectKey'),
          serverUrl: settings.get('serverUrl')
        })
        return taskReport
      } catch (err) {
        if (err && err.message) {
          core.error(`[SQ] Parse Task report error: ${err.message}`)
        } else if (err) {
          core.error(`[SQ] Parse Task report error: ${JSON.stringify(err)}`)
        }
        throw err
      }
    } catch (err) {
      throw TaskReport.throwInvalidReport(
        `[SQ] Error reading file: ${err.message || JSON.stringify(err)}`
      )
    }
  }

  private static createTaskReportFromString(
    fileContent: string
  ): Map<string, string> {
    const lines: string[] = fileContent.replace(/\r\n/g, '\n').split('\n') // proofs against xplat line-ending issues
    const settings = new Map<string, string>()
    for (const line of lines) {
      const splitLine = line.split('=')
      if (splitLine.length > 1) {
        settings.set(
          splitLine[0],
          splitLine.slice(1, splitLine.length).join('=')
        )
      }
    }
    return settings
  }

  private static throwMissingField(field: string): Error {
    return new Error(
      `Failed to create TaskReport object. Missing field: ${field}`
    )
  }

  private static throwInvalidReport(debugMsg: string): Error {
    core.error(debugMsg)
    return new Error(
      'Invalid or missing task report. Check that the analysis finished successfully.'
    )
  }
}
