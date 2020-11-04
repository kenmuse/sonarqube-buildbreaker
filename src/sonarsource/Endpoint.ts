export const PROP_NAMES = {
  HOST_URL: 'sonar.host.url',
  LOGIN: 'sonar.login',
  PASSSWORD: 'sonar.password',
  ORG: 'sonar.organization',
  PROJECTKEY: 'sonar.projectKey',
  PROJECTNAME: 'sonar.projectName',
  PROJECTVERSION: 'sonar.projectVersion',
  PROJECTSOURCES: 'sonar.sources',
  PROJECTSETTINGS: 'project.settings'
}

export default class Endpoint {
  constructor(readonly url: string, readonly token: string) {}

  toSonarProps(): {[prop: string]: string} {
    return {
      [PROP_NAMES.HOST_URL]: this.url,
      [PROP_NAMES.LOGIN]: this.token
    }
  }

  static getEndpoint(url: string, token: string): Endpoint {
    return new Endpoint(url, token)
  }
}
