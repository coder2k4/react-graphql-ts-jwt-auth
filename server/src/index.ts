import "reflect-metadata";
import express from 'express'
import {ApolloServer} from "apollo-server-express";
import {UserResolver} from "./UserResolver";
import {buildSchema} from "type-graphql";
import {createConnection} from "typeorm";
import "dotenv/config"
//import cookieParser from "cookie-parser";
const cookieParser = require('cookie-parser')
// import {User} from "./entity/User";

import {createAccessToken, createRefreshToken} from "./auth";
import {User} from "./entity/User";
import {verify} from "jsonwebtoken";
import {sendRefreshToken} from "./sendRefreshToken";
import cors from "cors"

(async () => {

    // console.log(process.env.ACCESS_TOKEN_SECRET)
    // console.log(process.env.REFRESH_TOKEN_SECRET)

    const app = express()
    app.use(cors({
        origin: '*',
        credentials: true,
    }))
    app.use(cookieParser())
    app.get("/", (_req, res) => res.send("Im on!"))

    app.post("/refresh_token", async (req, res) => {
        const token = req.cookies.jid;
        if (!token) {
            return res.send({ok: false, accessToken: ""});
        }

        let payload: any = null;
        try {
            payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            console.log(err);
            return res.send({ok: false, accessToken: ""});
        }

        // token is valid and
        // we can send back an access token
        const user = await User.findOne({id: payload.userId});

        if (!user) {
            return res.send({ok: false, accessToken: ""});
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ok: false, accessToken: ""});
        }

        sendRefreshToken(res, createRefreshToken(user));

        return res.send({ok: true, accessToken: createAccessToken(user)});
    });

    await createConnection() // typeorm подготовка таблиц

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver],
        }),
        context: ({req, res}) => ({req, res})
    })

    apolloServer.applyMiddleware({app})


    app.listen(4000, () => {
        console.log('Server start at http://localhost:4000')
    })
})()


// createConnection().then(async connection => {
//
//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);
//
//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);
//
//     console.log("Here you can setup and run express/koa/any other framework.");
//
// }).catch(error => console.log(error));
