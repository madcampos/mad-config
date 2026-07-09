<#
.SYNOPSIS
    Generates a Markdown changelog from Git history.

.DESCRIPTION
    This script extracts commit messages between two git references (defaulting from the latest tag to `HEAD`),
    groups them by convention types following conventional commits (feat, fix, etc.), and exports them to a Markdown file.

    It can also handle version bumping from `package.json`, automatic committing, and pushing changes to the repository's remote.

.PARAMETER From
    The starting git reference (tag or commit SHA). If omitted, defaults to the latest git tag.

.PARAMETER To
    The ending git reference. Defaults to `HEAD`.

.PARAMETER OutputDir
    The directory where the generated Markdown file will be saved.

.PARAMETER CommitMessage
    The message used when committing the changelog. Defaults to "chore: update changelog".

.PARAMETER PackagePath
    Path to the `package.json` file to read the new version from.
    If it is provided, the version will be used for the changelog file and the new tag.

    This is useful after an `npm version` command.

.PARAMETER Commit
    If set, automatically stage and commit the generated changelog file.

.PARAMETER Tag
    If set, create a new git tag for the version in `package.json`.

.PARAMETER Push
    If set, automatically create a commit, a git tag, and pushes to remote.

.PARAMETER CreateRelease
    If set, create a new GitHub release using the `gh` CLI if available.
#>
[CmdletBinding()]
param (
	[string]$From,
	[string]$To = 'HEAD',
	[Parameter(Mandatory = $true)][string]$OutputDir,

	[string]$CommitMessage = 'chore: update changelog',

	[Parameter(Mandatory = $false, ParameterSetName = 'Default')]
	[Parameter(Mandatory = $true, ParameterSetName = 'Commit')]
	[Parameter(Mandatory = $true, ParameterSetName = 'Push')]
	[string]$PackagePath,

	[Parameter(ParameterSetName = 'Commit')][switch]$Commit,
	[Parameter(ParameterSetName = 'Commit')][switch]$Tag,
	[Parameter(ParameterSetName = 'Push')][switch]$Push,
	[Parameter(ParameterSetName = 'Push')][switch]$CreateRelease
)

$VersionName = $To
if ($Tag -or $Push) {
	if (Test-Path $PackagePath) {
		$Package = Get-Content $PackagePath -Raw | ConvertFrom-Json
		$VersionName = "v$($Package.version)"
	}
}

if ([string]::IsNullOrWhiteSpace($From)) {
	$From = git describe --tags --abbrev=0 2>$null

	if ($LASTEXITCODE -ne 0) {
		$From = git rev-list --max-parents=0 HEAD
	}
}

$SectionHeaders = [ordered]@{
	build = '### Builds'
	breaking = '### Breaking Changes'
	chore = '### Chores & Tasks'
	ci = '### CI'
	docs = '### Documentation Updates'
	examples = '### Examples'
	feat = '### Enhancements'
	fix = '### Fixes'
	misc = '### Miscellaneous'
	perf = '### Performance Improvements'
	refactor = '### Refactors'
	revert = '### Changes Rollback'
	style = '### Stylistic Changes'
	types = '### Type Changes'
	test = '### Tests'
}

$Commits = git --no-pager log "$($From ? "$From..." : '')$To" --pretty=format:"%h`t%s" |
ConvertFrom-Csv -Delimiter "`t" -Header 'Hash', 'Message' |
ForEach-Object {
	if ($_.Message -match '^(?<type>\w+)(?:\((?<scope>.*)\))?(?<breaking>!)?: (?<desc>.*)$') {
		$LogMessage = $Matches.desc
		if ($Matches.scope) {
			$LogMessage = "**$($Matches.scope)**: $($Matches.desc)"
		}

		$Group = 'misc'
		if ($Matches.breaking) {
			$Group = 'breaking'
		} elseif ($SectionHeaders.Keys -contains $Matches.type) {
			$Group = $Matches.type
		}
	} else {
		$Group = 'misc'
		$LogMessage = $_.Message
	}

	@{
		Hash = $_.Hash
		Group = $Group
		Message = $LogMessage
	}
} |
Group-Object -Property 'Group' |
Sort-Object -Property @{ Expression = { [Array]::IndexOf($SectionHeaders.Keys, $_.Name) } }


$BaseUrl = "$(git remote get-url origin)" -replace '.github.io.git', ''
$ChangelogDate = git log -1 --format="%cI" "$To"
$ChangelogHeader = @"
---
date: $ChangelogDate
versionName: $VersionName
---

[compare changes]($BaseUrl/compare/$From...$VersionName)
"@

if (-not (Test-Path $OutputDir)) {
	New-Item -Path $OutputDir -ItemType 'Directory' -Force | Out-Null
}

$DestFile = "$(Join-Path -Path $OutputDir -ChildPath "$VersionName.md")"
$ChangelogHeader | Out-File $DestFile -Encoding 'UTF8' -Force

$Commits |
ForEach-Object {
	$CommitGroup = $SectionHeaders.$($_.Name)

	"`n$CommitGroup`n" | Out-File $DestFile -Encoding 'UTF8' -Append

	$_.Group |
	ForEach-Object {
		$Hash = $_.Hash
		$CommitMessage = $_.Message

		"- $CommitMessage ([$Hash]($BaseUrl/commit/$Hash))" | Out-File $DestFile -Encoding 'UTF8' -Append
	}
}

if ($Commit -or $Push) {
	git add "$DestFile"
	git commit -m "$CommitMessage" --quiet

	if ($Tag -or $Push) {
		git tag -a "$VersionName" -m "$VersionName"
	}
}

if ($Push) {
	git push --follow-tags --quiet
}

if ($CreateRelease) {
	if (Get-Command gh -ErrorAction SilentlyContinue) {
		gh release create "$VersionName" --notes-file "$DestFile" --title "$VersionName"
	} else {
		Write-Warning 'gh CLI not found. Skipping release creation.'
	}
}
