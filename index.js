const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = process.env.SECRET_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// create middleware for token
// const secretRouter = async(req, res, next){
//     console.log(req.h)
// }
async function run() {
  const bookingCollection = client.db("BookingDB").collection("rooms");
  const usersCollection = client.db("BookingDB").collection("users");
  const bookCollection = client.db("BookingDB").collection("bookings");
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
  app.post("/jwt", async (req, res) => {
    try {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TK, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send(token);
    } catch (error) {
      console.log(error);
    }
  });
  // booking
  app.patch("/bookings", async (req, res) => {
    try {
      const query = req.body;
      // booking date
      const bookDate = {
        startDate: query.bookingSum.endDate,
        endDate: query.bookingSum.endDate,
      };
      const email = { email: query.email };
      // booking information
      // const data = {
      //   title: query.title,
      //   date,
      //   price: query.price,
      //   size: query.size,
      //   description: query.description,
      //   img: query.img,
      // };
      // room id
      const id = req.body.bookingSum.id;
      const find = { _id: new ObjectId(id) };
      // booking date
      const UpdateDoc = {
        $set: {
          bookDate,
          email,
        },
      };
      // const options = { upsert: true };
      const roomBook = await bookingCollection.updateOne(find, UpdateDoc);
      // const book = await bookCollection.insertOne(query);
      console.log(UpdateDoc, id);
      res.send(roomBook);
    } catch (error) {
      res.send(error);
    }
  });
  //   post user
  app.post("/users", async (req, res) => {
    try {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    } catch (error) {
      console.log(error);
    }
  });
  // get/read room
  // Single rooms
  app.get("/rooms/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      // console.log(id);
      res.send(result);
    } catch (error) {
      console.log(error);
    }
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
