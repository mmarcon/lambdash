require('dotenv').config();
const process = require('process');

const { Lambdash } = require('.');

async function run () {
  const lambdash = new Lambdash({ clusterConnectionString: process.env.getMongoResult });
  lambdash.on('lambda created', result => console.log(result?.curl));
  lambdash.on('error', e => console.log(e));
  await lambdash.login(process.env);
  await lambdash.createLambdaFromCommand({
    command: `db.movies.aggregate([
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
  ]).lambda({
    name: 'foo-csv',
    paramTypes: {
      from: 'Int32',
      to: 'Int32'
    },
    format: 'csv'
  })`,
    database: 'sample_mflix'
  });
}

run();
