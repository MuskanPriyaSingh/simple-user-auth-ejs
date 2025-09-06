import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import {config} from 'dotenv';

import { v2 as cloudinary } from 'cloudinary';

const app = express();

// .env setup
config({path: '.env'});

app.use(express.urlencoded({extended:true}));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

mongoose.connect(process.env.MONGODB_URL, {
  dbName: "NodeJS_Practice",
}).then(() => console.log("MongoDB is connected!"))
  .catch((error) => console.log(error))

// rendering Login file
app.get('/', (req, res) => {
  res.render('login.ejs', { url: null })
})

// rendering Registeration file
app.get('/register', (req, res) => {
  res.render('register.ejs', { url: null })
})

const storage = multer.diskStorage({
  // destination: './public/uploads',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix)
  },
});

const upload = multer({ storage: storage });


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  filename: String,
  public_id: String,
  imgUrl: String,
});

const User = mongoose.model("userInfo", userSchema)

app.post('/register', upload.single('file'), async (req, res) => {
  const file = req.file.path;

  const { name, email, password } = req.body;

  const cloudinaryRes = await cloudinary.uploader.upload(file, {
    folder: "Uploaded Images"
  });

  // creating userInfo
  const db = await User.create({
    name,
    email,
    password,
    filename: file.originalname,
    public_id: cloudinaryRes.public_id,
    imgUrl: cloudinaryRes.secure_url,
  });

  res.redirect('/');

  // res.json({message:'file uploaded', cloudinaryRes})
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });
  if (!user) res.render("login.ejs");
  else if (user.password != password) {
    res.render("login.ejs");
  }else{
    res.render('profile.ejs',{user});
  }
})

const port = process.env.PORT;
app.listen(port, () => console.log(`Server is running on port ${port}`))