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
const secretRouter = async (req, res, next) => {
  // console.log(req.cookies?.token)
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }
  jwt.verify(token, process.env.SECRET_TK, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    req.user = decoded;
    next();
  });
};
async function run() {
  const roomCollection = client.db("BookingDB").collection("rooms");
  const usersCollection = client.db("BookingDB").collection("users");
  const bookCollection = client.db("BookingDB").collection("bookings");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
  //   create jwt token
  app.post("/jwt", async (req, res) => {
    try {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TK, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    } catch (error) {
      res.send(error);
    }
  });
  // logout
  app.post("/logout", async (req, res) => {
    const user = req.body;
    res.clearCookie("token", { maxAge: 0 }).send({ success: true });
  });

  // my booking room
  app.get("/books/:id", secretRouter, async (req, res) => {
    try {
      // console.log(req.user.email)
      const email = { email: req.params.id };
      if (req.params.id !== req.user.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = bookCollection.find(email);
      const result = await query.toArray();
      res.send(result);
    } catch (error) {
      res.send(error);
    }
  });

  // remove book room
  app.delete("/remove/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(filter);
      // console.log(id);
      res.send(result);
    } catch (error) {
      res.send(error);
    }
  });

  // booking
  app.patch("/bookings", async (req, res) => {
    try {
      const query = req.body;
      // booking date
      const bookDate = {
        startDate: query.bookingSum.startDate,
        endDate: query.bookingSum.endDate,
      };
      const email = query.email;
      // booking information
      const data = {
        title: query.bookingSum.title,
        bookDate,
        email,
        price: query.bookingSum.price,
        size: query.bookingSum.size,
        img: query.bookingSum.img,
      };
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
      const roomBook = await roomCollection.updateOne(find, UpdateDoc);
      const book = await bookCollection.insertOne(data);
      // console.log(UpdateDoc, id);
      res.send(roomBook);
    } catch (error) {
      res.send(error);
    }
  });

  // user
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
      const result = await roomCollection.findOne(query);
      // console.log(id);
      res.send(result);
    } catch (error) {
      console.log(error);
    }
  });
  //all rooms
  app.get("/rooms", async (req, res) => {
    try {
      const query = roomCollection.find();
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
