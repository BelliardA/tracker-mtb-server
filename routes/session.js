import express from "express";

import db from "../db/connection.js";

import {ObjectId} from "mongodb";

const router = express.Router();

/**
* * route -> /session:
* * Parameters: null
* *   get:
* *     summary: Get all session
* *     description: Retrieve all session from the database.
*/
router.get("/", async (req, res) => {
    let collection = await db.collection("session");
    let result = await collection.find({}).toArray();
    res.send(result).status(200);
});

/**
 * * route -> /session/:id:
 * * Parameters: id (string)
 * *   get:
 * *     summary: Get a record by ID
 * *     description: Retrieve a record from the database by its ID.
 */
router.get("/:id", async (req, res) => {
    let collection = await db.collection("session");
    let query = {_id: new ObjectId(req.params.id)};
    let result = await collection.dinfOne(query);

    if(!result) res.send("Not Found").status(404);
    else res.send(result).status(200);
});

/**
 * * route -> /session:
 * * Parameters: null
 * *   post:
 * *     summary: Create a new record
 * *     description: Create a new record in the database.
 */
router.post("/", async (req, res) => {
    try{
        let newTrack = {
            name: req.body.name || "Unnamed Session",
            startTime: req.body.startTime || new Date(),
            endTime: req.body.endTime || null,
            notes: req.body.notes || "",
            sensors: {
                accelerometer: req.body.sensors?.accelerometer || [], // [{ timestamp, x, y, z }]
                gyroscope: req.body.sensors?.gyroscope || [],         // [{ timestamp, x, y, z }]
                gps: req.body.sensors?.gps || [],                     // [{ timestamp, latitude, longitude, altitude, speed, heading }]
                barometer: req.body.sensors?.barometer || []          // [{ timestamp, pressure, relativeAltitude }]
            }
        }
        let collection = await db.collection("session");
        let result = await collection.insertOne(newTrack);
        res.send(result).status(204);
    } catch(err) {
        console.error(err);
        res.send("Internal Server Error").status(500);
    }
});

/**
 * * route -> /session/:id:
 * * Parameters: id (string)
 * *   delete:
 * *     summary: Delete a record by ID
 * *     description: Delete a record from the database by its ID.
 */
router.delete("/:id", async (req, res) => {
    try{
        const query = {_id: new ObjectId(req.params.id)};

        const collection = db.collection("session");
        let result = await collection.deleteOne(query);

        res.send(result).status(200);
    } catch (err) {
        console.error(err);
        res.send("Internal Server Error").status(500);
    }
});

export default router;