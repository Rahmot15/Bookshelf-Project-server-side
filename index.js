const express = require('express')
const cors = require('cors');
require('dotenv').config()

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

async function run() {
    try {
        await client.connect();

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

        app.post('/books', async (req, res) => {
            const newBooks = req.body
            const result = await bookshelfCollections.insertOne(newBooks)
            res.send(result)
        })

        app.patch('/books/:id/upvote', async (req, res) => {
            const { id } = req.params;
            const result = await bookshelfCollections.updateOne(
                { _id: new ObjectId(id) },
                { $inc: { upvote: 1 } }
            );
            res.send(result);

        });


        app.delete('/books/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await bookshelfCollections.deleteOne(query)
            res.send(result)
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
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