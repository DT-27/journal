
// jshint esversion:6

if (process.env.NODE_ENV !== 'production') {
 require('dotenv').config()
}

//requiring middleware

const bcrypt                  = require('bcrypt');
const express                 = require("express");
const session                 = require("express-session");
const ejs                     = require("ejs");
const bodyparser              = require("body-parser");
const mongoose                = require("mongoose");
const LocalStrategy           =  require("passport-local").Strategy;
const passport                = require ("passport");
const passportLocalMongoose   = require ("passport-local-mongoose");
const methodOverride          = require("method-override");
const flash                   = require('connect-flash');
const crypto                  = require("crypto");
const async                   = require('async');
const nodemailer              = require("nodemailer");
const smtpTransport           = require("nodemailer-smtp-transport");
const favicon                 = require('serve-favicon');
const _                       = require("lodash");
const readline                = require("readline-sync");
const prompt                  = require('prompt');
const dotenv                  = require ('dotenv');





              const app = express();

              //using middleware

     app.set("views", __dirname + "/views");

     app.use(express.urlencoded({ extended: false }));

     app.set("view engine","ejs");

     app.use(express.static(__dirname + 'startbootstrap-business-frontpage-master/dist/css/'));

     prompt.start();

     app.use(methodOverride('_method'))

          const saltRounds = 10;

          app.use(flash());

    app.use(favicon(__dirname + '/favicon.ico'));

         prompt.start();

        //express sessions

     app.use(session({
       secret:process.env.SESSION_SECRET,
         resave: false,
          saveUninitialized: true}));


          const dbPassword = process.env.PASSWORD;




// connecting to da v--ptabase
mongoose.set("strictQuery", false);

mongoose.connect(`mongodb+srv://DT:${dbPassword}@cluster0.rlculrx.mongodb.net/`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("Database is working properly");
  })
  .catch(err => {
    console.error("Error connecting to the database:", err);
  });


const Diary = require("./UserInfo/Info")


//passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	Diary.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy({usernameField:"email"},function (email, password, done) {

	Diary.findOne({email:email}, function (err, user) {
		if (err) return done(err);
		if (!user)return done(null, false);


		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false)return done(null, false);

			return done(null, user);
		});
	});
}));




// login page
app.get('/', (req, res) => res.sendFile('views/index.html' , { root : __dirname}));


//signin page
app.get("/backtosign",function (req,res) {
     res.render("signin",{message:req.flash("message")})
 });



// signin post
  app.post('/home',(req, res) => {

          const email = req.body.email;
            Diary.findOne({ email: email }).then(user => {
              if (user) {
               req.flash('message','A user with this email already exist')
                res.redirect("/backtosign")

          } else {
                const Data = new Diary({
                  username:req.body.username,
                   email:req.body.email,
                    password:req.body.password
          });
                    bcrypt.genSalt(11, (err, salt) => {

                      bcrypt.hash(Data.password, salt, (err, hash) => {

        if (err) throw err;
                      Data.password = hash;
                        Data.save().then(user => {
                  req.flash(
                    'message',
                    'You are now registered and can log in'
                  );
                  res.render('login',{display:req.flash("display")});
                //  res.render("home",{name:Data,creator:Data.creator})

            })  .catch(err => console.log(err));
          });

        })
    };
  });
});



//login refresh
app.get('/login', (req, res) =>  res.render('login',{display:req.flash("display")}));


//login post request
app.post('/log',

     passport.authenticate('local',{ failureRedirect:'/login?error=true',successRedirect:'home', failureFlash:true, }),
      function(req,res){
       req.flash("display","User not found")
  }
);








//add categories
app.post("/catego/:id",(req,res)=>{

     let catName = req.body.category;
     Diary.findOne({_id:req.params.id}).then(cat=>{
       cat.Categories.push({
        newCategory:catName
       });
       cat.save();
       console.log(cat.Categories);

       res.render("home",{name:cat,category:cat.Categories})


})
});

//delete category
app.post("/delcat/:id",(req,res)=>{
  let query ={_id:req.user.id};

  Diary.findOneAndUpdate(query,
    {$pull:{Categories:{_id:req.params.id}}})
    .then(data=>{
      res.render("home",
      {
        name:data,
        creator:data.creator,
        category:data.Categories
      })
    })
  });

  app.get("/delcat/:id",(req,res)=>{
    Diary.findOne({_id:req.user.id}).then(data=>{
      res.render("home",
      {
        name:data,
        creator:data.creator,
        category:data.Categories
      })
    })
  });

  let catid;


// get catItem
app.get("/catItem/:id", async(req,res)=>{
  console.log(req.params.id+"sigma");


   catid=req.params.id;

     Diary.findById(req.user.id).then(data=>{

       console.log(data)

           res.render("category",{name:data,tit:data.Categories,id:req.params.id});


 }).catch(err=> console.log(err));


});


















//todolist
app.get("/todo/:id",(req,res)=>{
  Diary.findOne({_id:req.params.id}).then(list=>{
    const something = list.Todolist.push({
      name:"Welcome to your todolist! "
    })
    res.render("todolist",
    {

      TodoTitle:"Today",
      id:req.params.id,
      Newlist:list.Todolist

  });

  })

});
//adding content to todolist
app.post("/add/:id",(req,res)=>{
  console.log(req.body.newItem);
  let info =  req.body.newItem;

    Diary.findOne({_id:req.params.id}).then(add=>{
      if (info.length > 0) {
       add.Todolist.push({
        name:req.body.newItem
       });
       add.save();
console.log(add.Todolist)

      res.render("todolist",{
        TodoTitle:"Today",
        id:req.params.id,
        Newlist:add.Todolist

      })
    }else{
      res.render("todolist",{
        TodoTitle:"Today",
        id:req.params.id,
        Newlist:add.Todolist

      })
    }
    })


});

//checking out items from todolist
app.post("/delete/:id",(req,res)=>{
  console.log(req.params.id)
  console.log(req.body.checkbox)
  let query ={_id:req.params.id}
  let info = Diary.findOneAndUpdate(query,
    {$pull:{Todolist:{_id:req.body.checkbox}}}).then(box=>{

      res.render("todolist",{
        TodoTitle:"Today",
        id:req.params.id,
        Newlist:box.Todolist

});


})
   });

//deleting from todolist
app.get("/delete/:id",(req,res)=>{
  Diary.findOne({_id:req.params.id}).then(boc=>{
    res.render("todolist",{
      TodoTitle:"Today",
      id:req.params.id,
      Newlist:boc.Todolist

  })
  })

});




//rendering typearea page
app.get("/type/:id",async(req, res)=>{

  await Diary.findOne({
    _id:req.params.id
  }).then(async(data) =>{
     console.log(data.id);
       res.render("typearea",{data:data})
   }).catch(err=>console.log(err))

});










//posting/pushing typearea content
app.put('/backtodiary/:id', async(req, res) => {
    let category_id =catid;
   let tit = await Diary.findById(req.user.id);

    await Diary.updateMany({
          _id:req.params.id,
          'Categories._id':category_id
        },
        {"$push":{
          "Categories.$.CatContent":{
            "title":req.body.title,
            "content":req.body.content
          }
        }}
        ).then(async(data)=>{

          await res.render("category",{name:data,tit:tit.Categories,id:category_id});
        })

     });




  // rendering categories page after typing content
  app.get("/backtodiary/:id",function(req,res){
    let category_id =catid;
     Diary.findById(req.user.id).then(tit=>{
      res.render("category",{name:tit,tit:tit.Categories,id:category_id});
     });


  });




    // rendering home page for refresh
  app.get("/home",checkAuthenticated,async(req,res)=>{

      console.log(req.user.id);
        let user = await Diary.findById(req.user.id);
        res.render("home",{name:user,creator:user.creator,category:user.Categories})

    });




//View/read
app.get("/journal/:id",(req,res)=>{

  Diary.findById(req.user.id).then(data=>{
    let segment = data.Categories.find(x => x.id === catid);

  res.render("page",{data:data,creator:segment,id:req.params.id,catid:catid})
}).catch(err=> console.log(err))

});



//edit page get request
app.get("/journal/edit/:id",async(req,res)=>{

 Diary.findById(req.user.id).then(data=>{
          let segment = data.Categories.find(x => x.id === catid);
          console.log("wait o"+segment+"welldone jesus");
        res.render("edit",{data:data,creator:segment,id:req.params.id,catid:catid})
  }).catch(err=> console.log(err))

});


//edit page get request when in page
app.get("/edit/:id", async (req,res)=>{

  await Diary.findById(req.user.id).then(tit=>{
    res.render("category",{name:tit,tit:tit.Categories,id:catid});

  })

});


//editing user content
app.put('/edit/:id',async (req,res)=>{

 let tit = await Diary.findById(req.user.id);
 Diary.findOneAndUpdate(
  {
    _id: req.user.id,
    "Categories._id": catid
  },
  {
    $set: { "Categories.$.CatContent.$[v].title": req.body.newtitle,
            "Categories.$.CatContent.$[v].content": req.body.newcontent,
  }
  },
  {
    arrayFilters: [{ "v._id": req.params.id }],
    upsert: true,
    new: true
  }
).then(data=>{
  res.render("category",{name:tit,tit:tit.Categories,id:catid});
})

});



// deleting content
app.delete("/diary/delete/:id",async(req,res)=>{
  console.log(req.params.id +"a differnt id");
  let tit = await Diary.findById(req.user.id);

   let query ={_id:req.user.id}
    let info = Diary.findOneAndUpdate({
      _id:req.user.id,
      'Categories._id':catid,
    },
      {$pull:{
        "Categories.$.CatContent":{
         _id:req.params.id
        }
      }}).then(info=>{

        res.render("category",{name:tit,tit:tit.Categories,id:catid});

  });
});


   // rendering home after deleting
app.get("/diary/delete/:id",(req,res)=>{

  let category_id =catid;
  Diary.findById(req.user.id).then(tit=>{
   res.render("category",{name:tit,tit:tit.Categories,id:category_id});
  });


});






/*
app.get("/recyclebin",function(req,res){
  res.render("recyclebin")
});

app.get("/stared",function(req,res){
  Diary.find().then(data =>{
    res.render("stared",{data:data})
  }).catch(err => console.log(err));

});


 app.get("/diary/stared/:id",(req,res)=>{
   const stared =
   Diary.findOne({
    _id:req.params.id
  }).then(data=>{
    res.render("stared",{data:data})
  }).catch(err => console.log(err));


}); */








//logOut
app.get("/logOut", function (req, res) {
   req.logout(function(err) {
      if (err) { return next(err); }
       res.redirect('/');
    });
});



// forgot password page
app.get("/forgotpass",(req,res)=>{

   res.render("forgotpassword",{error:req.flash("error"),otperror:req.flash("otperror")})

});

// random Int
   let random;


// user email
    var mail;


// sending OTP code to users
app.post("/forgotpassword",(req,res)=>{
   random =  crypto.randomInt(10000,99999);
     mail = req.body.mail;

      Diary.findOne({ email: mail }).then(forgot => {
  if (forgot) {
    let transporter = nodemailer.createTransport(smtpTransport({
          sendmail: true,
          host: "smtp.gmail.com",
          port: 587,
          secure:false,
          auth: {
               user:"d.t.thedeveloper@gmail.com",
              pass:process.env.emailPass
             },
             debug: true,
             logger: true,
             tls: {
                  rejectUnauthorized: false
                }
     }))

     ejs.renderFile("./views/reset_code.ejs",{crypto:random}, function(err, data){
           if(err){
               console.log(err);
           }else {

           let mailOptions = {
               from: process.env.email,
               to:mail,
               subject: 'OTP code',
               text:"this is a forgot password reset code",
               html: data,
               attachments:[{
                 filename:"favicon.ico",
                 path:"views/favicon.ico",
                 cid:"for@email.tt"
             }]
         }
         console.log(mailOptions.text)

         transporter.sendMail(mailOptions, function (error, info) {

          if(error){
            console.log(error)
         }else {
           console.log("email sent:"+ info.response)
          }
       });
     }
  })

         res.render("VFcodeentry");

    }else{
       req.flash("error","email was not found")
        res.render("forgotpassword",{error:req.flash("error"),otperror:req.flash("otperror")});
    }
  })

});




// matching OTP code
app.post("/optcode",(req,res)=>{
   let code =req.body.number;

  if (code == random) {
      res.render("updatepassword",{matching:req.flash("matching"),mailnotfound:req.flash("mailnotfound")});
  }else {
      req.flash("otperror","verification code does not match")
       res.render("forgotpassword",{error:req.flash("error"),otperror:req.flash("otperror")})
   }
});




  // resending OTP code
app.get("/resend",(req,res)=>{

  let transporter = nodemailer.createTransport(smtpTransport({
    sendmail: true,
    host: "smtp.gmail.com",
    port: 587,
    secure:false,
    auth: {
         user:"d.t.thedeveloper@gmail.com",
        pass:process.env.emailPass
       },
     debug: true,
     logger: true,
  tls: {
     rejectUnauthorized: false
    }
 }))


 ejs.renderFile("./views/reset_code.ejs",{crypto:random}, function(err, data){
         if(err){
           console.log(err);
         }else {

       let mailOptions = {
           from: '"Your Journal - OTP" <_mainaccount@thejournal.top>',
           to:mail,
           subject: 'OTP code',
           text:"this is a forgot password reset code",
           html: data,
           attachments:[{
                filename:"favicon.ico",
                path:"views/favicon.ico",
                cid:"for@email.tt"
              }]
     }

        console.log(mailOptions.text)

   transporter.sendMail(mailOptions, function (error, info) {
       if(error){
          console.log(error)
     }else {
         console.log("email sent:"+ info.response)
       }
      });
     }
   })
          res.render("VFcodeentry");

});



   // update password page
 app.post("/updatepassword", async (req,res)=>{
 let fmail = req.body.fmail;
 let pass1= req.body.password1;
 let pass2 = req.body.password2;
 let encypassword =   await bcrypt.hash(pass2,saltRounds);


if (pass1== pass2) {
   console.log("almost there");
  Diary.findOne({ email: fmail }).then(update => {
       if (update) {
            console.log("user found");
    Diary.findOneAndUpdate({email:fmail}, {$set: {password:encypassword}}, {upsert: true, useFindAndModify:true}, function(err){
          console.log("access");

          res.render('login',{display:req.flash("display")});
    })
  }else {
     req.flash("mailnotfound","Your email does not match")
      res.render('updatepassword',{matching:req.flash("matching"),mailnotfound:req.flash("mailnotfound")})

        console.log("email does not exist");
    }
  })
 }else {
    req.flash("matching","passwords don't match")
      res.render("updatepassword",{matching:req.flash("matching"),mailnotfound:req.flash("mailnotfound")})
  }

 });

//delete account
app.get("/delacc",(req,res)=>{
     console.log(req.user.id);
 Diary.deleteMany({_id:req.user.id}).then(is=>{
      res.render("signin",{message:req.flash("message")})
 }

 )

})



// passport authentication
 function checkAuthenticated(req, res, next) {
   if (req.isAuthenticated()) {
     return next()
   }

    res.redirect('login')
  }

   function checkNotAuthenticated(req, res, next) {
     if (req.isAuthenticated()) {
       return res.redirect('/')
    }
         next()
  };



  const server = app.listen(process.env.PORT || 3000, () => {
    const port = server.address().port;
    console.log(`Express is working on port ${port}`);
  });
