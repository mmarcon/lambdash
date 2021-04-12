require('dotenv').config();
const process = require('process');
const BSON = require('bson');

const { Lambdash } = require('.');

async function run () {
  const lambdash = new Lambdash({ redactedUrl: process.env.getMongoResult });
  lambdash.on('ready', () => console.log('lambdash ready!'));
  lambdash.on('realm app ready', appId => console.log('realm app ready', appId));
  lambdash.on('realm http service ready', httpServiceId => console.log('realm http service ready', httpServiceId));
  lambdash.on('atlas service ready', () => console.log('atlas service ready'));
  lambdash.on('lambda created', secret => console.log(secret));
  lambdash.on('error', e => console.log(e));
  await lambdash.login(process.env);
  await lambdash.createLambda('genres2', {
    queryOrAggregation: `[
    {
      $match: {
        year: {
          $gte: from,
          $lte: to
        }
      }
    },
    {
      $unwind: {
        path: '$genres'
      }
    },
    {
      $group: {
        _id: '$genres',
        total: {
          $sum: 1
        }
      }
    },
    {
      $project: {
        genre: '$_id',
        _id: 0,
        total: 1
      }
    },
    {
      $sort: {
        total: -1
      }
    }
  ]`,
    paramTypes: {
      from: BSON.Int32,
      to: BSON.Int32
    },
    database: 'sample_mflix',
    collection: 'movies'
  });
}

run();
