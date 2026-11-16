// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix "spawn EPERM" on Windows by running in-band and enabling worker threads
config.maxWorkers = 1;
config.transformer.unstable_workerThreads = true;
config.watcher.unstable_workerThreads = true;

module.exports = config;
