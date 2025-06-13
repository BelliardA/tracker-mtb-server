import { version } from 'ethers';
import {MongoClient, ServerApiVersion} from 'mongodb';

import dotenv from "dotenv";
dotenv.config(); 

const uri = process.env.ATLAS_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

try{
    //Connecter le client au server
    await client.connect();

    //envoyé un ping de confirmation de connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
} catch (e) {
    console.error(e);
}

let db = client.db("recherche");

export default db;