#!/usr/bin/env node
const assert = require('assert')
const GitHub = require('github')

assert(process.env.ELECTRON_GITHUB_TOKEN, 'ELECTRON_GITHUB_TOKEN not found in environment')

const github = new GitHub({
  followRedirects: false
})
github.authenticate({type: 'token', token: process.env.ELECTRON_GITHUB_TOKEN})
const githubOpts = {
  owner: 'electron',
  repo: 'electron'
}

async function getReleases () {
  console.log(`About to get releases.`)
  let releases = await github.repos.getReleases(githubOpts)
    .catch(err => {
      console.log('$fail} Could not get releases.  Error was', err)
    })
  console.log(`Releases are`, releases)
}

getReleases()
