var express = require('express');
var graphqlHTTP = require('express-graphql');
var {buildSchema} = require('graphql');
var mysql = require('mysql');

var schema = buildSchema(`
    type User {
        id: String,
        name: String,
        job_title: String,
        email: String
    }

    type Mutation {
        updateUserInfo(id: Int, name: String, job_title: String, email: String) : Boolean,
        createUser(id: Int, name: String, job_title: String, email: String): Boolean,
        deleteUser(id: Int): Boolean
    }
    
    type Query {
        getUsers: [User],
        getUserInfo(id: Int): User        
    }
`);


const queryDB = (req, sql, args) => new Promise((resolve, reject) => { 
    req.mysqldb.query(sql, args, (error, rows) => {
        if(error)
            return reject(error);
        rows.changedRows || 
        rows.affectedRows ||
        rows.insertId ? resolve(true) : resolve(rows);        
    })
});

var root = {
    getUsers: (args, req) => queryDB(req, 'select * from users').then(data => data),
    getUserInfo: (args, req) => queryDB(req, 'select * from users where id = ?', [args.id]).then(data => data[0]),
    updateUserInfo: (args, req) => queryDB(req, 'update user set ? where id = ?' ,[args, args.id]).then(data => data),
    createUser: (args, req) => queryDB(req, 'insert into users set ? ', args).then(data => data),
    deleteUser: (args, req) => queryDB(req, 'delete from users where id = ? ', [args.id]).then(data => data)
};

var app = express();

app.use((req,res,next) => {
    req.mysqldb = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root@1234',
        database: 'userapp'
    });
    req.mysqldb.connect();
    next();
});

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

app.listen(4000);
console.log('Server GraphQL started at localhost:4000/graphql');
