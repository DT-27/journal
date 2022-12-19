
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
const prompt                  = require("prompt");
const crypto                  = require("crypto");
const async                   = require('async');
const nodemailer              = require("nodemailer");
const favicon                 = require('serve-favicon');


              const app = express();

// connecting to database
mongoose.connect("mongodb://localhost:27017/diary",
{
  useNewUrlParser:true,
  useUnifiedTopology:true

}).then(console.log("Database is working properly"))
.catch(err => console.log(err));

const Diary = require("./UserInfo/Info")


//using middleware

app.set("view engine","ejs");

app.set("views", __dirname + "/views");

app.use(express.static("public"));

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

  //bodyparser
app.use(express.urlencoded({ extended: false }));


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
app.get('/', (req, res) => res.render('login',{display:req.flash("display")}));


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
                    res.redirect("login")
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



//rendering typearea page
app.get("/type/:id",(req,res)=>{

  Diary.findOne({
    _id:req.params.id
  }).then(data =>{
     console.log(data.id);
       res.render("typearea",{data:data})
   }).catch(err=>console.log(err))

});


//posting/pushing typearea content
app.put('/backtodiary/:id', (req, res) => {

    Diary.findById(req.params.id)
      .then(function (info) {
         info.creator.push({
            title:req.body.title,
              content:req.body.content
        })
                    info.save();

                    res.render("home",{name:info,creator:info.creator})
              }).catch(err=> console.log(err))

  });



    // rendering home page for refresh
  app.get("/home",checkAuthenticated,async(req,res)=>{

      console.log(req.user.id);
        let user = await Diary.findById(req.user.id);
          res.render("home",{name:user,creator:user.creator})

    });


    // rendering home page after typing content
  app.get("/backtodiary/:id",function(req,res){

   Diary.findById(req.params.id).then((data)=>{
  console.log(data.creator);
    res.render("home",{name:data,creator:data.creator})
       }).catch(err=>console.log(err))

  });



//View/read
app.get("/journal/:id",(req,res)=>{

   Diary.findById(req.user.id).then(data=>{
     res.render("page",{data:data,creator:data.creator,id:req.params.id})
  }).catch(err=> console.log(err))

});



//edit page get request
app.get("/diary/edit/:id" ,async(req,res)=>{

 Diary.findById(req.user.id).then(data=>{
        res.render("edit",{data:data,creator:data.creator,id:req.params.id})
  }).catch(err=> console.log(err))

});


//edit page get request when in page
app.get("/edit/:id", async (req,res)=>{

  let render = await Diary.findById(req.user.id);
   res.render("home",{name:render,creator:render.creator})

});


//editing user content
app.put('/edit/:id',async (req,res)=>{

     Diary.updateMany(
       {
          "creator._id":req.params.id
      },
      {
       "$set":{
          "creator.$.title": req.body.newtitle,
          "creator.$.content":req.body.newcontent
       }
     }
   ).then(data=>{
        console.log(data);
   });
      let render = await Diary.findById(req.user.id);
       res.render("home",{name:render,creator:render.creator});

});



// deleting content
app.delete("/diary/delete/:id",(req,res)=>{
  console.log(req.params.id);

   let query ={_id:req.user.id}
    let info = Diary.findOneAndUpdate(query,
      {$pull:{creator:{_id:req.params.id}}}).then(info=>{

  res.render("home",{name:info,creator:info.creator})

  });
});


   // rendering home after deleting
app.get("/diary/delete/:id",(req,res)=>{

   Diary.findById(req.user.id).then((data)=>{
      console.log(data.creator);
        res.render("home",{name:data,creator:data.creator})
   }).catch(err=>console.log(err))

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
    let transporter = nodemailer.createTransport({
       service: 'gmail',//smtp.gmail.com  //in place of service use host...
        secure: false,//true
          port: 25,//465
           auth: {
               user: process.env.MyEmail,
              pass:process.env.emailPass
             },
             tls: {
                  rejectUnauthorized: false
                }
     })

     ejs.renderFile("./views/reset_code.ejs",{crypto:random}, function(err, data){
           if(err){
               console.log(err);
           }else {

           let mailOptions = {
               from: 'd.t.thedeveloper@gmail.com',
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

  let transporter = nodemailer.createTransport({
     service: 'gmail',
   secure: false,
   port: 25,
   auth: {
     user: process.env.MyEmail,
     pass: process.env.emailPass
   }, tls: {
     rejectUnauthorized: false
    }
 })


 ejs.renderFile("./views/reset_code.ejs",{crypto:random}, function(err, data){
         if(err){
           console.log(err);
         }else {

       let mailOptions = {
           from: 'd.t.thedeveloper@gmail.com',
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
