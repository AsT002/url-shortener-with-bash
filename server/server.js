require("dotenv").config(); // load .env variables into process

// dependencies
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const shortId = require("shortid");
const validUrl = require("valid-url");
const base_url = `http://localhost:${process.env.PORT}/`

async function connect() {
    // connect to the MongoDB Database.
    try {
        await mongoose.connect(process.env.URI)
        console.log("Connected to the database.")
        // successfully connected.
    } catch (err) {
        console.log(err) // an error occurred, couldn't connect to the database
    }
}

connect();

const app = express();
const shortUrlSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true,
    },
    originalUrl: {
        type: String,
        required: true,
        unique: true,
    }
}) // schema for the documents
const shortUrl = mongoose.model("shortUrls", shortUrlSchema); // model

app.use(cors());
app.use(bodyParser.json());

app.get("/:id", async (req, res) => {
    let id = req.params['id'];
    try {
        const foundDocument = await shortUrl.findOne({
            shortId: id
        })

        if (foundDocument) { // make sure foundDocument isn't falsy.
            res.redirect(foundDocument.originalUrl);
        } else {
            throw new Error("ID not found.")
        }
    } catch (err) {
        res.status(404).send(`Error finding provided ID: "${id}"`);
    }
});

app.post("/api/shorten", async (req, res) => {
    const body = req.body;
    const url = body.url;

    console.log(url)

    if (url && validUrl.isUri(url)) {
        // valid url, check if the original url already exists in the database to avoid duplication.

        let originalFound = await shortUrl.findOne({
            originalUrl: url
        })

        if (originalFound) {
            // we have the same url in the database
            res.send(base_url + originalFound.shortId);
        } else {
            let attempts = 0;
            async function createShortUrl(uniqueId)  {
                attempts ++;
                try {
                    (await new shortUrl({
                        shortId: uniqueId,
                        originalUrl: url
                    })).save();
                    return uniqueId;
                } catch (err) {
                    if (attempts < 5) {
                        return createShortUrl(shortId.generate())
                    } else {
                        throw new Error("Attempts exceeded, couldn't create url record in the database.")
                    }
                }
            }
            
            try {
                let generatedID = await createShortUrl(shortId.generate())
                res.send(base_url + generatedID);
            } catch (err) {
                console.log(err)
                res.status(500).send("Attempts to create a record has passed reached limit.")
            }
        }
    }
    else res.status(400).send("Invalid URL supplied");
})

const listener = app.listen(process.env.PORT, () => {
    console.log(`Listening on Port ${listener.address().port}`);
})