const express = require('express')
const cors = require('cors');
require('dotenv').config()

const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-service.json");

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wkt35jm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token)
        req.decoded = decoded
        next()
    }
    catch {
        return res.status(401).send({ message: 'unauthorized access' })
    }
}

const verifyTokenEmail = (req, res, next) => {
    if (req.query.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();
}

async function run() {
    try {

        const bookshelfCollections = client.db("Bookshelfdb").collection('books')

        app.get('/books', async (req, res) => {

            const result = await bookshelfCollections.find().toArray()
            res.send(result)
        })

        app.get('/books/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookshelfCollections.findOne(query)
            res.send(result)

        })

        app.get('/myBooks', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const result = await bookshelfCollections.find(query).toArray()
            res.send(result)
        })

        app.post('/books', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
            const newBook = req.body;
            const result = await bookshelfCollections.insertOne(newBook);
            res.send(result);
        });

        app.patch('/books/:id/upvote', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
            const { id } = req.params;
            const result = await bookshelfCollections.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { upvote: 1 } }
            );
            res.send(result);

        });

        app.patch("/books/:id/status", verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
            const id = req.params.id;
            const { reading_status } = req.body;
            const result = await bookshelfCollections.updateOne(
                { _id: new ObjectId(id) },
                { $set: { reading_status } }
            );
            res.send(result);
        });

        app.put('/books/:id', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
            const { id } = req.params
            const { book_title, cover_photo, total_page, book_author, book_category, reading_status, book_overview, upvote } = req.body
            const query = { _id: new ObjectId(id) }
            const updateData = {
                $set: {
                    book_title,
                    cover_photo,
                    total_page,
                    book_author,
                    book_category,
                    reading_status,
                    book_overview,
                    upvote

                }
            }
            const result = await bookshelfCollections.updateOne(query, updateData)
            res.send(result)
        })


        app.delete('/books/:id', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookshelfCollections.deleteOne(query)
            res.send(result)
        })


        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Bookshelf server is running!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})