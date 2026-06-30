const express = require('express');

const APP_KEY = '__libraryTestApp';

async function initTestApp() {
  process.env.NODE_ENV = 'test';
  await require('../../src/db').initDb();

  const app = express();
  app.use(express.json());
  app.use('/api/loans', require('../../src/routes/loans'));
  app.use('/api/reports', require('../../src/routes/reports'));

  globalThis[APP_KEY] = app;
  return app;
}

function getApp() {
  const app = globalThis[APP_KEY];
  if (!app) {
    throw new Error('Test app not initialised — call initTestApp() in beforeAll');
  }
  return app;
}

function resetDb() {
  require('../../src/db').clearAllTables();
}

module.exports = { initTestApp, getApp, resetDb };
