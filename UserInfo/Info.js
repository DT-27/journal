    // requiring middleware
const mongoose                = require("mongoose");
const passportLocalMongoose   = require ("passport-local-mongoose");

//creating schemas

//For content and title
const infoSchema = new mongoose.Schema({

  title:{
    type:mongoose.Mixed

  },
  content:{
    type:mongoose.Mixed
  },
   date:  {
     type: Date,
     default: Date.now,
      get: (date)=> date.toLocaleDateString("en-US")
   }

});
//For categories
 const CategorieSchema = new mongoose.Schema({
  newCategory:{
    type:mongoose.Mixed
  },
   date:  {
     type: Date,
     default: Date.now,
      get: (date)=> date.toLocaleDateString("en-US")
   },
  CatContent:[ infoSchema ]
 })


//for todolist
const itemsSchema = new mongoose.Schema ({
  name:{
    type:mongoose.Mixed
  }
});


//Signing and imbeded database
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

  Todolist:[itemsSchema],

  Categories:[CategorieSchema]

});

diarySchema.plugin(passportLocalMongoose);

const Diary = mongoose.model("diary",diarySchema);



 module.exports = Diary
