const { parseFromCommand } = require('./lib/lambda-generator/parser');

console.log(parseFromCommand(`
  db.foo.find({age: {$gt: 10}});
`));
console.log(parseFromCommand(`
  db['foo'].find({age: {$gt: 10}});
`));
console.log(parseFromCommand(`
  db.getCollection('foo').find({age: {$gt: 10}});
`));
console.log(parseFromCommand(`
  db.getCollection('foo').find({age: {$gt: ageAsVariable}});
`));
console.log(parseFromCommand(`
db.getCollection('foo').aggregate(
  [
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
    ]
  );
`));
