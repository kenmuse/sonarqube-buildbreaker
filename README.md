# Introduction 
This GitHub Action is based on a popular Azure DevOps task: https://marketplace.visualstudio.com/items?itemName=SimondeLang.sonarqube-buildbreaker

It will connect to SonarQube, wait for your analysis job to complete, then either pass or fail your GitHub build based on the status of the SonarQube Quality Gate.

NOTE: If you are using SonarCloud use this action instead: https://github.com/dylan-smith/sonarcloud-buildbreaker

# Getting Started
You need to pass this task your SonarQube URL (e.g. http://sonarqube.contoso.com:9000), and SonarQube token.  See instructions here for getting your SonarQube token: https://docs.sonarqube.org/latest/user-guide/user-token/

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
- name: Install Sonar scanner
  shell: pwsh
  run: |
    New-Item -Path ./.sonar/scanner -ItemType Directory
    dotnet tool update dotnet-sonarscanner --tool-path ./.sonar/scanner --version 4.10.0
- name: Prepare Sonar
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Needed to get PR information, if any
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  shell: pwsh
  run: ./.sonar/scanner/dotnet-sonarscanner begin /k:"my-sonar-project" /d:sonar.login="${{ secrets.SONAR_TOKEN }}" /d:sonar.host.url="http://sonarqube.contoso.com:9000"
- name: Install dependencies
  run: dotnet restore src/AdventOfCode.sln
- name: Build
  run: dotnet build src/AdventOfCode.sln --configuration Release --no-restore
- name: SonarQube Analysis
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Needed to get PR information, if any
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  shell: pwsh
  run: ./.sonar/scanner/dotnet-sonarscanner end /d:sonar.login="${{ secrets.SONAR_TOKEN }}"
- name: Break Build on SonarQube Quality Gate
  uses: dylan-smith/sonarqube-buildbreaker@main
  with:
    sonarUrl: "http://sonarqube.contoso.com:9000"
    sonarToken: ${{ secrets.SONAR_TOKEN }}
```