    // requiring middleware
const mongoose                = require("mongoose");
const passportLocalMongoose   = require ("passport-local-mongoose");

//creating schemas

const infoSchema = new mongoose.Schema({

  title:{
    type:String

  },
  content:{
    type:String
  },
   date:  {
     type: Date,
     default: Date.now,
      get: (date)=> date.toLocaleDateString("en-US")
   }

});



const diarySchema = new mongoose.Schema({
  username:{
    type:mongoose.Mixed
  },
  email:{
    type:mongoose.Mixed
  },
  password:{
    type:mongoose.Mixed
  },
  creator:[infoSchema]

});
diarySchema.plugin(passportLocalMongoose);

const Diary = mongoose.model("diary",diarySchema);



 module.exports = Diary
