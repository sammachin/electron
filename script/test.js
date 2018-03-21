#!/usr/bin/env node
require('colors')
const args = require('minimist')(process.argv.slice(2), {
  boolean: ['automaticRelease', 'notesOnly', 'stable']
})
const assert = require('assert')
const GitHub = require('github')
const { GitProcess } = require('dugite')
const fail = '\u2717'.red
const pass = '\u2713'.green
const path = require('path')
const gitDir = path.resolve(__dirname, '..')

assert(process.env.ELECTRON_GITHUB_TOKEN, 'ELECTRON_GITHUB_TOKEN not found in environment')

const github = new GitHub({
  followRedirects: false
})
github.authenticate({type: 'token', token: process.env.ELECTRON_GITHUB_TOKEN})

async function getReleases () {
  let newVersion = '2.0.0-beta.6'
  let branchToTarget
  if (args.branch) {
    branchToTarget = args.branch
  } else {
    branchToTarget = await getCurrentBranch(gitDir)
  }
  console.log(`About to get releases.`)
  const githubOpts = {
    owner: 'electron',
    repo: 'electron'
  }
  let releases = await github.repos.getReleases(githubOpts)
    .catch(err => {
      console.log('$fail} Could not get releases.  Error was', err)
    })
  console.log(`Releases are`, releases)

  let drafts = releases.data.filter(release => release.draft &&
    release.tag_name === newVersion)
  if (drafts.length > 0) {
    console.log(`${fail} Aborting because draft release for
      ${drafts[0].tag_name} already exists.`)
    process.exit(1)
  }
  console.log(`${pass} A draft release does not exist; creating one.`)
  githubOpts.draft = true
  githubOpts.name = `electron ${newVersion}`
  githubOpts.body = 'This is just a test -- ignore me'
  githubOpts.tag_name = newVersion
  githubOpts.target_commitish = branchToTarget
  console.log(`Trying to createRelease for ${newVersion}`, githubOpts)
  await github.repos.createRelease(githubOpts)
    .catch(err => {
      console.log(`${fail} Error creating new release: `, err)
      process.exit(1)
    })
  console.log(`${pass} Draft release for ${newVersion} has been created.`)
}

async function getCurrentBranch () {
  console.log(`Determining current git branch`)
  let gitArgs = ['rev-parse', 'HEAD']
  let branchDetails = await GitProcess.exec(gitArgs, gitDir)
  if (branchDetails.exitCode === 0) {
    let currentBranch = branchDetails.stdout.trim()
    console.log(`${pass} Successfully determined current git branch is ` +
      `${currentBranch}`)
    return currentBranch
  } else {
    let error = GitProcess.parseError(branchDetails.stderr)
    console.log(`${fail} Could not get details for the current branch,
      error was ${branchDetails.stderr}`, error)
    process.exit(1)
  }
}

getReleases()
