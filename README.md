# Introduction 
This GitHub Action is based on a popular Azure DevOps task: https://marketplace.visualstudio.com/items?itemName=SimondeLang.sonarcloud-buildbreaker

It will connect to SonarCloud, wait for your analysis job to complete, then either pass or fail your GitHub build based on the status of the SonarCloud Quality Gate.

# Getting Started
You need to pass this task your SonarCloud organization name, and SonarCloud token.  See instructions here for getting your SonarCloud token: https://docs.sonarqube.org/latest/user-guide/user-token/

```yaml
steps:
- uses: actions/checkout@v2
  with:
    fetch-depth: 0  # Shallow clones should be disabled for a better relevancy of analysis
- name: Setup .NET Core
  uses: actions/setup-dotnet@v1
  with:
    dotnet-version: 3.1.301
- name: Setup Java 11
  uses: actions/setup-java@v1
  with:
    java-version: '11' # The JDK version to make available on the path.
    java-package: jre # (jre, jdk, or jdk+fx) - defaults to jdk
- name: Install SonarCloud scanner
  shell: pwsh
  run: |
    New-Item -Path ./.sonar/scanner -ItemType Directory
    dotnet tool update dotnet-sonarscanner --tool-path ./.sonar/scanner --version 4.10.0
- name: Prepare SonarCloud
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Needed to get PR information, if any
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  shell: pwsh
  run: ./.sonar/scanner/dotnet-sonarscanner begin /k:"my-sonar-project" /o:"my-sonar-organization" /d:sonar.login="${{ secrets.SONAR_TOKEN }}" /d:sonar.host.url="https://sonarcloud.io"
- name: Install dependencies
  run: dotnet restore src/AdventOfCode.sln
- name: Build
  run: dotnet build src/AdventOfCode.sln --configuration Release --no-restore
- name: SonarCloud Analysis
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Needed to get PR information, if any
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  shell: pwsh
  run: ./.sonar/scanner/dotnet-sonarscanner end /d:sonar.login="${{ secrets.SONAR_TOKEN }}"
- name: Break Build on SonarCloud Quality Gate
  uses: dylan-smith/sonarcloud-buildbreaker@main
  with:
    sonarToken: ${{ secrets.SONAR_TOKEN }}
    sonarOrganization: my-sonar-organization
```