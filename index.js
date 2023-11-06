const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin:["http://localhost:5173"],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser())

const uri = process.env.SECRET_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const bookingCollection = client.db("BookingDB").collection("rooms");
  const usersCollection = client.db("BookingDB").collection("users");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
  //   create user token 
  app.post('/jwt', async(req, res)=>{
    const user = req.body
    const token = jwt.sign(user, process.env.SECRET_TK, {expiresIn: '1h'})
    res
    .cookie("token", token, {
        httpOnly:true,
        secure:false
    })
    .send(token)
  })
//   post user
app.post("/users", async(req, res)=>{
    const user = req.body
    const result = await usersCollection.insertOne(user)
    res.send(result)
})
  // get/read room
  // Single rooms
  app.get("/rooms/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await bookingCollection.findOne(query);
    // console.log(id);
    res.send(result);
  });
  //all rooms
  app.get("/rooms", async (req, res) => {
    try {
      const query = bookingCollection.find();
      const result = await query.toArray();
      res.send(result);
    } catch (error) {
      console.log(error);
    }
  });
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("booking is running...");
});
app.listen(port, () => {
  console.log(`Booking app running is port ${port}`);
});
