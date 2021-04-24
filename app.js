require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const http = require("http");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook');
const findOrCreate = require("mongoose-findorcreate");
const axios = require("axios");
const md5 = require("md5");
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");
const fetch = require('node-fetch');
const qs = require("qs");
const crypto = require("crypto");
const app = express();
const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')

const server = http.createServer(app);
const io = require("socket.io")(server);

// const baseUrl = "https://lit-springs-71721.herokuapp.com"
const baseUrl = "https://lit-springs-71721.herokuapp.com"

const appID = '2a820502a7f04b05ad918a7d9793fdf0';
const appCertificate = 'c8ee7b8a170f4ac4a028fe6580a95c3f';
const channelName = "myChannel";
const uid = 2882341273;
const account = "2882341273";
const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 360000
const currentTimestamp = Math.floor(Date.now() / 1000)
const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

app.use(express.static(__dirname+"/public"));
app.set('view engine', "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'Healthhighway2020Secretforthisyear',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly : false, path : "/", maxAge : 12342424 }
}))


app.get("/username", (req, res) => {
    res.render("register");
})


io.on('connection', (socket) => {
    socket.on('givedata', async(msg) => {
        console.log(msg);
        var options = {
            "amount": msg.amount*100 ,
            "currency": "INR",
            "receipt": "Health Highway",
            "payment_capture": 1
        };
       const {data} = await axios({
            method : 'post',
            url : 'https://api.razorpay.com/v1/orders',
            timeout : 6000,
            headers : {
                "Authorization" : "Basic cnpwX3Rlc3RfT3hDZjZsOHRiTHRVd206RWpFZGozMkV3SWlwaUR1ME1iNHg1d0dV",
                "Content-Type" : "application/json"
            },
            data : {
                ...options
            }
        });
        console.log(data);
         socket.emit('welcome', {paymentData : data, sessionInfo : msg});
    })
})


// app.get("/toki", async(req, res) => {
//     const token = await RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
//     console.log("Token With Integer Number Uid: " + token);
// })
// app.get("/", (req, res) => {
//     res.redirect("/home");
// })
app.get("/", (req,res) => {
    console.log("at /");
    console.log(req.session);
    if(req.session.HH_user)
    {
        if(req.session.HH_user.old)
        {
            res.render("index", {old:true, username: req.session.HH_user.username, _id:req.session.HH_user._id});
        }
        else
        {
            req.session.HH_user=null;
            res.redirect("/");
        }
    }
    else
    {
        res.render("index", {old:false});
    }
})


app.get("/personal/:_id", async (req,res) => {
    if(req.session.HH_user)
    {
        await axios.get(baseUrl+'/mySessions/'+req.params._id)
        .then(async (sessions) => {
            console.log(sessions.status);
            console.log("theses are sessions");
            console.log(sessions.data);
            await axios.get(baseUrl+'/myOrders/'+req.params._id)
             .then(async (orders) => {
                 console.log(orders.status);
                 console.log("theses are orders");
                 console.log(orders.data);
                 res.render("personal", {orders : orders.data, sessions : sessions.data})
             })
             .catch(err => {
                 console.log(err);
                 req.session.HH_user=null;
                 res.redirect("/home");
             })
        }).catch(err => {
            console.log(err);
            req.session.HH_user=null;
            res.redirect("/home");
        })
    }else
    {
        req.session.HH_user=null;
        res.redirect("/home");
    }
});

app.get("/services", (req, res) => {
    console.log("at /services");
    res.render("items");
});

// app.get("/per", (req, res) => {
//     res.render("personal");
// });

// app.get("/dopay", async (req, res) => {
//     var options = {
//         "amount": 100 ,
//         "currency": "INR",
//         "receipt": "healthHighway",
//         "payment_capture": 1
//     };
//    const {data} = await axios({
//         method : 'post',
//         url : 'https://api.razorpay.com/v1/orders',
//         timeout : 6000,
//         headers : {
//             "Authorization" : "Basic cnpwX2xpdmVfNmpOME5XZ0psbWdNR0Y6MjdVNFlkZHBTWGVaNmR5ek1iVUlJYms0",
//             "Content-Type" : "application/json"
//         },
//         data : {
//             ...options
//         }
//     });
//     console.log(data);
//     res.render("justpay", {options : data});
// })

app.get("/phone", (req, res) => {
    console.log("at /phone");
    console.log(req.session);
    if(req.session.HH_user)
    {
        if(req.session.HH_user.old)
        {
            res.redirect("/");
        }
        else
        {
            req.redirect("/register-with-email");
        }
    }
    else
    {
        res.render("phone");
    }
});

app.post("/phoneauth", async (req, res) => {
    req.session.HH_user = {phoneNumber : req.body.phoneNumber};
    var resp;
    console.log(req.body);
    await fetch(baseUrl+"/create-user-with-pn", {
            method: "POST",
            body: qs.stringify({
                phoneNumber : req.body.phoneNumber
            }),
            headers: { 
                "Content-type": "application/x-www-form-urlencoded"
            } 
    }).then(async (response) => {
        console.log(response.status);
        if(response.status == 200)
        {
            const r1 = await response.json();
            console.log(r1);
            req.session.HH_user["_id"] = r1._id;
            req.session.HH_user["old"] = r1.old;
            if(r1.username)
            {
                req.session.HH_user["username"] = r1.username;
            }
            resp = {...r1};
        }
        else
        {
            console.log("nulling at /phoneauth");
            req.session.HH_user = null;
            res.redirect("/");
        }
    }).catch(err => {
        console.log("nulling at /phoenauth catch");
        req.session.HH_user = null;
        console.log(err);
        res.redirect("/");
    });
    res.contentType = "application/json; charset=utf-8";
    res.send(resp);
})

app.get("/register-with-email", (req, res) => {
    console.log("at get register with email");
    console.log(req.session);
    if(req.session.HH_user)
    {
        if(req.session.HH_user.old)
        {
            res.redirect("/");
        }
        else
        {
            console.log("rendering register");
            res.render("register");
        }
    }
    else
    {
        res.redirect("/");
    }
});

app.post("/register-with-eu", (req,res) => {
    console.log("at post email");
    console.log(req.body);
   console.log(req.session);
   fetch(baseUrl+"/update-user-with-eu", {
        method: "POST",
        body: qs.stringify({
            phoneNumber : req.session.HH_user.phoneNumber,
            email : req.body.email,
            username : req.body.username
        }),
        headers: { 
            "Content-type": "application/x-www-form-urlencoded"
        } 
   }).then(async (response) => {
       console.log(response.status);
       if(response.status == 200)
       {
            const r1 = await response.json();
            req.session.HH_user["_id"] = r1._id;
            req.session.HH_user["old"] = r1.old;
            req.session.HH_user["username"] = r1.username;
            res.redirect("/");
       }
       else
       {
          req.session.HH_user = null;
          res.redirect("/");
       }
   }).catch(err => {
        console.log(err);
        req.session.HH_user = null;
        res.redirect("/");
   });
});

app.post("/register-with-oe", (req,res) => {
   console.log("at post oe")
   console.log(req.session);
   console.log(req.body);
   fetch(baseUrl+"/update-user-with-oe", {
        method: "POST",
        body: qs.stringify({
            phoneNumber : req.session.HH_user.phoneNumber,
            email : req.body.email,
            pu : req.body.pu,
            username : req.body.username
        }),
        headers: { 
            "Content-type": "application/x-www-form-urlencoded"
        } 
   }).then(async (response) => {
       console.log(response.status);
       if(response.status == 200)
       {
            const r1 = await response.json();
            req.session.HH_user["_id"] = r1._id;
            req.session.HH_user["old"] = r1.old;
            req.session.HH_user["username"] = r1.username;
            res.redirect("/home");
       }
       else
       {
          req.session.HH_user = null;
          res.redirect("/home");
       }
   }).catch(err => {
        console.log(err);
        req.session.HH_user = null;
        res.redirect("/home");
   });
});

app.get("/book-a-session/:id", (req, res) => {
    console.log(req.params.id);
    if(req.session.HH_user && req.session.HH_user.old)
    {
        res.render("checkout", {id : req.params.id, uid : req.session.HH_user._id})
    }
    else
    {
        res.redirect("/phone");
    }
});

app.post("/bookSessionAfterPay", (req, res) => {
    console.log(req.body);
    fetch(baseUrl+"/paid-sessions/"+req.body.uid, {
            method: "POST",
            body: qs.stringify({
                ...req.body
            }),
            headers: { 
                "Content-type": "application/x-www-form-urlencoded"
            } 
    }).then(async (response) => {
        console.log(response.status);
        if(response.status == 200)
        {
            res.contentType = "application/json; charset=utf-8";
            res.send({"booked" : true});
        }
        else
        {
            res.contentType = "application/json; charset=utf-8";
            res.send({"booked" : false});
        }
    }).catch(err => {
        console.log(err);
        res.contentType = "application/json; charset=utf-8";
        res.send({"booked" : false});
    });
});


app.get("/joinLiveSessionSingle/:channelName", (req, res) => {
    console.log(req.params.channelName);
    if(!req.session.HH_user)
    {
       res.redirect("/phone")
    }
    else if(req.session.HH_user && req.session.HH_user._id)
    {
        fetch(baseUrl+"/getTokenForVc/"+4321+"/"+req.params.channelName, {
            method : "GET"
        }).then(async (response) => {
            console.log(response.status);
            const r1 = await response.json();
            console.log(r1);
            // res.redirect(`/video-session/"${r1.token}"/${req.params.channelName}/${req.session.HH_user._id}`)
            res.render("video", {token:r1.token, channelName:req.params.channelName, uid: '4321', authority:"non-trainer"});
        }).catch(err => {
            console.log(err);
            res.redirect("/personal/"+req.session.HH_user._id);
        })
    }
})



app.get("/takeLiveSessionSingle/:channelName", (req, res) => {
    if(!req.session.HH_Trainer)
    {
       res.redirect("/trainerLogin")
    }
    else if(req.session.HH_Trainer && req.session.HH_Trainer.tid)
    {
        fetch(baseUrl+"/getTokenForVc/"+1234+"/"+req.params.channelName, {
            method : "GET"
        }).then(async (response) => {
            console.log(response.status);
            const r1 = await response.json();
            console.log(r1);
            // res.redirect(`/video-session/"${r1.token}"/${req.params.channelName}/${req.session.HH_Trainer.tid}`)
            res.render("video", {token:r1.token, channelName:req.params.channelName, uid: '1234', authority:"trainer"});
        }).catch(err => {
            console.log(err);
            res.redirect("/trainer");
        })
    }
})

// app.get("/video-session/:token/:channelName/:uid", (req, res) => {
//     if(req.session.HH_user && req.session.HH_Trainer)
//     {
//         req.session.HH_Trainer = null;
//         req.session.HH_user = null;
//         res.redirect("/")
//     }
//     else
//     {
//         if(req.session.HH_Trainer && req.session.HH_Trainer.tid)
//         {
//             res.render("video", {token:req.params.token, channelName:req.params.channelName, uid:req.params.uid, authority:"trainer"});
//         }
//         else
//         {
//             res.render("video", {token:req.params.token, channelName:req.params.channelName, uid:req.params.uid, authority:"non-trainer"});
//         }
//     }
// });

app.get("/redirected", (req, res) => {
    if(req.session.HH_user && req.session.HH_Trainer)
    {
        req.session.HH_Trainer = null;
        req.session.HH_user = null;
        res.redirect("/")
    }
    else
    {
        if(req.session.HH_Trainer && req.session.HH_Trainer.tid)
        {
            res.redirect("/trainer");
        }
        else
        {
            res.redirect("/personal/"+req.session.HH_user._id);
        }
    }
})

// app.get("/try", (req, res) => {
//     res.render("try", {name : "Vyom"});
// })

// app.get("/zoom", (req, res) => {
//      res.render("home");
// });

// app.get("/getcred", (req, res) => {
//     console.log("caled");
//     const apiKey = "jM9m7c1RS5WoP4-9IU8_9w";
//     const apiSecret = "sfybQem9YNO4TKhuhWtCYiDz2zscAE84GuL3";
//     const meetingNumber = 100;
//     const role = 1;
//     const timestamp = new Date().getTime() - 30000
//     const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
//     const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
//     const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
//     res.contentType = "application/json; charset=utf-8";
//     res.send({signature, apiKey, meetingNumber});
// })

app.get("/session-booking-failure", (req, res) => {
     req.session.HH_user = null;
     res.redirect("/");
})

// app.get("/sp", (req, res) => {
//     res.render("phone");
// })

app.get("/logout", (req, res) => {
    req.session.HH_user = null;
    req.session.HH_Trainer=null;
    res.redirect('/');
});

app.get("/auth-fail", (req, res) => {
    req.session.HH_user = null;
    res.redirect("/");
});

app.get("/error", (req, res) => {
    req.session.HH_user = null;
    req.redirect("/");
});


// app.get("/reg", (req, res) => {
//     res.render("register");
// });

// app.get("/personal", (req, res) => {
//     res.render("personal");
// });

// app.get("/try", (req, res) => {
//     res.render("checkout");
// });

// app.get("/video", (req, res) => {
//     res.render("video");
// });

app.get("/trainerLogin", (req, res) => {
    if(req.session.HH_Trainer && req.session.HH_Trainer.tid)
    {
        res.redirect("/trainer");
    }
    else
    {
        res.render("trainerLogin");
    }
});

app.post("/trainerLogin", async (req, res) => {
     console.log(req.body);
     fetch(baseUrl+"/getTrainer", {
        method: "POST",
        body: qs.stringify({
            tid : req.body.tid,
            tPhoneNumber : req.body.tPhoneNumber
        }),
        headers: { 
            "Content-type": "application/x-www-form-urlencoded"
        } 
   }).then(async (response) => {
        console.log(response.status);
        var r1 = await response.json();
        console.log(r1);
        if(response.status == 200)
        {
            req.session.HH_Trainer={tid : req.body.tid};
            res.redirect("/trainer");
        }
        else
        {
            res.redirect("/trainerLogin");
        }
   }).catch(err => {
        console.log("some error");
        console.log(err);
        res.redirect("/trainerLogin");
   });
});


app.get("/trainer", async (req, res) => {
    console.log("/trainer got called");
    console.log(req.session);
    if(req.session.HH_Trainer && req.session.HH_user)
    {
        req.session.HH_Trainer=null;
        req.session.HH_user=null;
    }
    if(req.session.HH_Trainer && req.session.HH_Trainer.tid)
    {
        await fetch(baseUrl+"/trainerSessions/"+req.session.HH_Trainer.tid, {
            method : "GET"
        }).then(async (sessions) => {
            console.log(sessions.status);
            var r2 = await sessions.json();
            if(sessions.status == 200)
            {
                res.render("trainer", {mySessions : r2});
            }
            else
            {
                req.session.HH_Trainer=null;
                req.session.HH_user=null;
                res.redirect("/trainerLogin")
            }
        })
    }
    else
    {
        res.redirect("/trainerLogin")
    }
})

app.get("*", (req,res) => {
    res.redirect("/");
})



var port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening at ${port}`)
});
