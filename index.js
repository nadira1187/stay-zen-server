const express =require('express');
const app = express();
const cors =require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port =process.env.PORT ||5000;

//middleware 
app.use(cors({
    origin: ['http://localhost:5173',
    'https://stay-zen-client.web.app','http://localhost:5174'],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());

//middlewareno



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xwlezc0.mongodb.net/?retryWrites=true&w=majority`;
//console.log(process.env.ACCESS_TOKEN_SECRET);


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const logger =async(req,res,next)=>{
   // console.log('called',req.host,req.originalUrl)
    next();
}
const verifyToken =async(req,res,next)=>{
    const token=req.cookies?.token;
   console.log('value of token',token)
    if(!token)
    {
        return res.status(401).send({message:'not authorized'});
    }
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).send({message:'unauthorized'});
        }
        console.log('value of token',decoded)
        req.user=decoded;
        next();
    })
  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const roomsCollection=client.db('roomDb').collection('rooms');
    const bookingCollection =client.db('roomDb').collection('bookings');
    const reviewCollection=client.db('roomDb').collection('reviews');
    app.post('/jwt',logger,async(req,res)=>{
        const user=req.body;
        console.log(user);
        const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
        res
        .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            
        })
        .send({success:true})
    })


     app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 ,
                secure:process.env.NODE_ENV === 'production',
            }).send({ success: true })
        })
    app.get('/rooms',async(req,res) =>{
        const cursor =roomsCollection.find();
        const result= await cursor.toArray();
        res.send(result);
    })
     app.get('/rooms/:id',async(req,res)=>{
        const id=req.params.id;
        const query ={_id:new ObjectId(id)}
        const result = await roomsCollection.findOne(query );
        res.send(result);
     })
     app.get('/booking',async(req,res)=>{
        // console.log(req.query.email);
        //  console.log('tok tok token ',req.cookies.token)
        //  console.log('from valid token',req.user)
    //    if(req.query.email!==req.user.email)
    //    {
    //     return res.status(403).send({message:'forbidden access'})
    //    }
        let query ={};
        if(req.query?.email)
        {
            query={ email:req.query.email }
        }
        const result =await bookingCollection.find(query).toArray();
        res.send(result)
     })
     app.get('/booking/:id',async(req,res)=>{
        const id=req.params.id;
        const query ={_id:new ObjectId(id)}
        const result = await bookingCollection.findOne(query );
        res.send(result);
     })
     app.get('/review/:id',async(req,res)=>{
        const id=req.params.id;
        const query={service_id:id}
        const result=await reviewCollection.find(query).toArray();
        res.send(result);
     })
     app.post('/bookings',async(req,res)=>{
        const booking=req.body;
        //console.log(booking);
        const result =await bookingCollection.insertOne(booking);
        res.send(result);
     })
     app.post('/reviews',async(req,res)=>{
        const review=req.body;
        const result=await reviewCollection.insertOne(review);
        res.send(result);
     })
     app.delete('/bookingss/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)}
        const result=await bookingCollection.deleteOne(query);
        res.send(result);
     })
     app.patch("/roomss/:id", async (req, res) => {
        const roomId = req.params.id;
        const newAvailability = req.body.availability;
      
        const filter = { _id: new ObjectId(roomId) };
        const update = {
          $set: { availability: newAvailability },
        };
      
        
          const result = await roomsCollection.updateOne(filter, update);
      
         res.send(result)
      });
      

     app.put("/bookings/:id", async (req, res) => {
        const id = req.params.id;
       const filter={ _id: new ObjectId(id) };
       const options={ upsert: true}
       const updatedBooking=req.body;
            const booking = {
                 $set: { date: updatedBooking.date,
                name:updatedBooking.name,
            email:updatedBooking.email }
                 }
                 const result =await bookingCollection.updateOne(filter,booking,options)
                 res.send(result);
    });
    
     

    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
    res.send('server is runnung')
})

app.listen(port,()=>{
    console.log(` server is running on port ${port}`)
})