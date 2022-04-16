//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const dateFormatter = require(__dirname + "/dateFormatter.js");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const _ = require("lodash");
const faceApiService = require(__dirname + "/faceApiServiceForMatcher.js");
const faceApiDetect = require(__dirname + "/faceApiServiceForDetection.js");
//const tf = require("@tensorflow/tfjs-node");
const faceapi = require("@vladmandic/face-api/dist/face-api.node.js");
const canvas = require("canvas");
const { loadImage, Canvas, Image, ImageData } = canvas;
const fetch = require("node-fetch");
// const Blob = require("node-blob");

// Make face-api.js use that fetch implementation
// faceapi.env.monkeyPatch({ fetch: fetch, Blob : Blob });
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

const app = express();

if (process.env.NODE_ENV == "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
} //redirects all url to https in production

app.use("/", express.static(__dirname + "/public"));
app.use("/canvas", express.static(__dirname + "/node_modules/canvas"));
app.set("view engine", "ejs");
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

// set up multer for storing uploaded files

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

const sessionSecret = process.env.SESSION_SECRET;

app.use(cookieParser());

app.use(
  session({
    proxy: true,
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: sessionSecret,
    resave: true,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const mongoUserDBConnect = process.env.MONGO_USERDB_CONNECT;

mongoose.connect(mongoUserDBConnect, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

const imageSchema = new mongoose.Schema({
  name: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

const listingSchema = new mongoose.Schema({
  productImage: imageSchema,
  productName: String,
  productDescription: String,
  productCategory: String,
  productMinimumBid: Number,
  productEndTime: Date,
  //productImage:  BinData,
});

const biddingSchema = new mongoose.Schema({
  userId: String,
  productId: String,
  productBid: Number,
  bidTime: Date,
  testField: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  googleId: String,
  secret: String,
  role: String,
  userImage: { data: Buffer, contentType: String },
  emailVerified: { type: Boolean, default: false },
  listings: [listingSchema],
  biddings: [biddingSchema],
});

const tokenSchema = new mongoose.Schema({
  _userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now, expires: 43200 },
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Token = new mongoose.model("Token", tokenSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/groas",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate(
        {
          email: profile.emails[0].value,
          name: profile.displayName,
          googleId: profile.id,
          role: "USER",
        },
        function(err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.locals.accountType;

app.locals.isLoggedIn;

app.locals.userRole;

app.locals.currentDateTime;

app.locals.dateFormatter = dateFormatter;

app.locals.faceVerified;

var today = new Date();

currentDateTime = dateFormatter(today);

app.get("/", async function(req, res) {
  isLoggedIn = req.isAuthenticated();
  if (req.isAuthenticated()) {
    userRole = req.user.role;
    console.log("faceVerified: " + faceVerified);
    if (faceVerified == true) {
      if (req.user.emailVerified) {
        if (userRole == "ADMIN") {
          User.find({ _id: { $ne: req.user._id } }, "listings", function(
            err,
            UserDocsWithListingsWithoutBuyerListings
          ) {
            if (err) {
              console.log(err);
            } else {
              console.log(UserDocsWithListingsWithoutBuyerListings);

              var listingsPromises = [];
              const listingDetailsPromises = [];
              const higgestBiddersPromises = [];
              const productDetailsPromises = [];

              for (
                let i = 0;
                i < UserDocsWithListingsWithoutBuyerListings.length;
                i++
              ) {
                for (
                  let j = 0;
                  j <
                  UserDocsWithListingsWithoutBuyerListings[i].listings.length;
                  j++
                ) {
                  listingsPromises.push(
                    UserDocsWithListingsWithoutBuyerListings[i].listings[j]
                  );
                }
              }

              Promise.all(listingsPromises)
                .then((listings) => {
                  console.log(listings);

                  function higgestBidderDetailFinder(i) {
                    return new Promise((resolve) => {
                      console.log("Resolving " + i + " higgestBidderDetail");

                      resolve(
                        User.findOne(
                          { "biddings.productId": listings[i]._id },
                          "biddings.$"
                        )
                          .sort({ "biddings.productBid": -1 })
                          .limit(1)
                          .exec()
                      );
                    });
                  }

                  function productDetailsFinder(i) {
                    return new Promise((resolve) => {
                      console.log("Resolving " + i + " productDetail");

                      resolve(
                        User.findOne(
                          {
                            "listings._id": listings[i]._id,
                          },
                          "listings.$"
                        ).exec()
                      );
                    });
                  }

                  function newProductDetailsCreator(
                    i,
                    productDetail,
                    higgestBidder
                  ) {
                    return new Promise((resolve) => {
                      console.log("Resolving " + i + " newProductDetails");

                      function test() {
                        var obj = {
                          productImage: productDetail.listings[0].productImage,
                          productName: productDetail.listings[0].productName,
                          productCategory:
                            productDetail.listings[0].productCategory,
                          productEndTime:
                            productDetail.listings[0].productEndTime,
                          productMinimumBid:
                            productDetail.listings[0].productMinimumBid,
                          productHiggestBid:
                            higgestBidder != null
                              ? higgestBidder.biddings[0].productBid
                              : "NA",
                          productId: productDetail.listings[0]._id,
                        };
                        return obj;
                      }

                      resolve(test());
                    });
                  }

                  for (let i = 0, len = listings.length; i < len; i++) {
                    higgestBiddersPromises.push(higgestBidderDetailFinder(i));
                  }

                  Promise.all(higgestBiddersPromises)
                    .then((higgestBidders) => {
                      console.log("higgestBidders", higgestBidders);

                      for (let i = 0, len = listings.length; i < len; i++) {
                        productDetailsPromises.push(productDetailsFinder(i));
                      }

                      Promise.all(productDetailsPromises)
                        .then((productDetails) => {
                          console.log("productDetails", productDetails);

                          for (let i = 0, len = listings.length; i < len; i++) {
                            listingDetailsPromises.push(
                              newProductDetailsCreator(
                                i,
                                productDetails[i],
                                higgestBidders[i]
                              )
                            );
                          }

                          Promise.all(listingDetailsPromises)
                            .then((listingDetails) => {
                              console.log("listingDetails", listingDetails);

                              res.render("admin/home-admin", {
                                listingDetails: listingDetails,
                              });
                            })
                            .catch((e) => {
                              // handle errors here
                            });
                        })
                        .catch((e) => {
                          // handle errors here
                        });
                    })
                    .catch((e) => {
                      // handle errors here
                    });
                })
                .catch((e) => {
                  // handle errors here
                });

              // res.render("admin/home-admin", {
              //   userDocumentsWithListings: UserDocsWithListingsWithoutBuyerListings,
              // });
            }
          });
        } else if (accountType == "seller") {
          const sellerListingDetailsPromises = [];
          const higgestBiddersPromises = [];
          const productDetailsPromises = [];
          const listings = req.user.listings;

          function higgestBidderDetailFinder(i) {
            return new Promise((resolve) => {
              console.log("Resolving " + i + " higgestBidderDetail");

              resolve(
                User.findOne(
                  { "biddings.productId": listings[i]._id },
                  "biddings.$"
                )
                  .sort({ "biddings.productBid": -1 })
                  .limit(1)
                  .exec()
              );
            });
          }

          function productDetailsFinder(i) {
            return new Promise((resolve) => {
              console.log("Resolving " + i + " productDetail");

              resolve(
                User.findOne(
                  { _id: req.user._id, "listings._id": listings[i]._id },
                  "listings.$"
                ).exec()
              );
            });
          }

          function newProductDetailsCreator(i, productDetail, higgestBidder) {
            return new Promise((resolve) => {
              console.log("Resolving " + i + " newProductDetails");

              function test() {
                var obj = {
                  productImage: productDetail.listings[0].productImage,
                  productName: productDetail.listings[0].productName,
                  productCategory: productDetail.listings[0].productCategory,
                  productEndTime: productDetail.listings[0].productEndTime,
                  productMinimumBid:
                    productDetail.listings[0].productMinimumBid,
                  productHiggestBid:
                    higgestBidder != null
                      ? higgestBidder.biddings[0].productBid
                      : "NA",
                  productId: productDetail.listings[0]._id,
                };
                return obj;
              }

              resolve(test());
            });
          }

          for (let i = 0, len = listings.length; i < len; i++) {
            higgestBiddersPromises.push(higgestBidderDetailFinder(i));
          }

          Promise.all(higgestBiddersPromises)
            .then((higgestBidders) => {
              console.log("higgestBidders: ", higgestBidders);
              for (let i = 0, len = listings.length; i < len; i++) {
                productDetailsPromises.push(productDetailsFinder(i));
              }

              Promise.all(productDetailsPromises)
                .then((productDetails) => {
                  console.log("productDetails: ", productDetails);

                  for (let i = 0, len = listings.length; i < len; i++) {
                    sellerListingDetailsPromises.push(
                      newProductDetailsCreator(
                        i,
                        productDetails[i],
                        higgestBidders[i]
                      )
                    );
                  }

                  Promise.all(sellerListingDetailsPromises)
                    .then((sellerListingDetails) => {
                      console.log(
                        "sellerListingDetails: ",
                        sellerListingDetails
                      );

                      res.render("seller/home-seller", {
                        sellerListingDetails: sellerListingDetails,
                      });
                    })
                    .catch((e) => {
                      // handle errors here
                    });
                })
                .catch((e) => {
                  // handle errors here
                });
            })
            .catch((e) => {
              // handle errors here
            });
        } else if (accountType == "buyer") {
          User.find({ _id: { $ne: req.user._id } }, "listings", function(
            err,
            UserDocsWithListingsWithoutBuyerListings
          ) {
            if (err) {
              console.log(err);
            } else {
              console.log(UserDocsWithListingsWithoutBuyerListings);

              //   //------------test zone------------

              //   var foundUserBidsList = foundList.biddings;

              //   const foundListingListPromises = [];
              //   const biddingDetailsPromises = [];

              //   function foundListingListFinder(i, listing) {
              //     return new Promise((resolve) => {
              //       console.log("Resolving " + i + " foundListingListPromise");

              //       resolve(
              //         User.findOne(
              //           { _id:  req.user._id , "biddings.productId": listing._id },
              //           "biddings.$"
              //         ).exec()
              //       );
              //     });
              //   }

              //   function biddingDetailsCreator(i, foundListingList) {
              //     return new Promise((resolve) => {
              //       console.log("Resolving " + i + " biddingDetailsPromise");

              //       function test() {
              //         var obj = {
              //           productImage: foundListingList.listings[0].productImage,
              //           productName: foundListingList.listings[0].productName,
              //           productCategory:
              //             foundListingList.listings[0].productCategory,
              //           productDescription:
              //             foundListingList.listings[0].productDescription,
              //           productEndTime: foundListingList.listings[0].productEndTime,
              //           productBid: foundList.biddings[i].productBid,
              //           productId: foundList.biddings[i].productId,
              //         };
              //         return obj;
              //       }

              //       resolve(test());
              //     });
              //   }

              // for (let j = 0, len = UserDocsWithListingsWithoutBuyerListings.length; j < len; j++) {

              //   for (let i = 0, len = UserDocsWithListingsWithoutBuyerListings[j].listings.length; i < len; i++) {
              //     var listing = UserDocsWithListingsWithoutBuyerListings[j].listings[i];

              //     foundListingListPromises.push(foundListingListFinder(i, listing));
              //   }

              // }

              //   Promise.all(foundListingListPromises)
              //     .then((foundListingList) => {
              //       console.log("foundListingList: ", foundListingList);
              //       for (let i = 0, len = foundUserBidsList.length; i < len; i++) {
              //         biddingDetailsPromises.push(
              //           biddingDetailsCreator(i, foundListingList[i])
              //         );
              //       }

              //       Promise.all(biddingDetailsPromises)
              //         .then((biddingDetails) => {
              //           console.log("biddingDetails: ", biddingDetails);
              //           res.render("buyer/my-bids", {
              //             biddingDetails: biddingDetails,
              //           });
              //         })
              //         .catch((e) => {
              //           // handle errors here
              //         });
              //     })
              //     .catch((e) => {
              //       // handle errors here
              //     });

              //   //------------test zone------------

              res.render("buyer/home-buyer", {
                userDocumentsWithListings: UserDocsWithListingsWithoutBuyerListings,
              });
            }
          });
        } else {
          res.render("account-type");
        }
      } else {
        res.redirect("/verification-status/pending");
      }
    } else {
      res.render("user-recognition/webcam");
    }
  } else {
    // const imgUrl = path.join(
    //   __dirname,
    //   "/public/images/sample-images/Amitabh1.jpeg"
    // );

    // // const img = await faceapi.fetchImage(imgUrl);
    // const img = await loadImage(imgUrl);

    // const result = await faceApiService.detect(fs.readFileSync(imgUrl));

    // res.json({
    //   detectedFaces: result.length,
    // });
    res.render("home");
  }
});

app.get("/webcam", function(req, res) {
  accountType = null;
  isLoggedIn = req.isAuthenticated();
  res.render("user-recognition/webcam");
});

app.post("/webcam", async function(req, res) {
  console.log("Post request is sent");
  isLoggedIn = req.isAuthenticated();
  var img = new Image();
  img.src = req.body.srcForImg;

  // console.log(req.body.srcForImg);
  var result;
  if (img.src != "" && img.src != null) {
    result = await faceApiDetect.detect(img);
    console.log("Detected faces in Current Clicked Image: ", result.length);
  } else {
    result = null;
    console.log("No Image Data Submited");
  }
  if (result == null) {
    res.render("user-recognition/webcam");
  } else if (result.length == 0 || result.length > 1) {
    res.render("user-recognition/webcam");
  } else {
    obj = {
      data: img.src.replace(/^data:image\/(png|jpg);base64,/, ""),
      contentType: img.src.substring(
        img.src.indexOf(":") + 1,
        img.src.indexOf(";")
      ),
    };

    User.findOne({ _id: req.user._id }, async function(err, userDocument) {
      if (userDocument.userImage.data == null) {
        console.log("user image doesn't exists but will be added now");
        userDocument.userImage = obj;
        userDocument.save();
        faceVerified = true;
        res.redirect("/");
      } else {
        console.log("user image exists");
        var dbImg = new Image();
        dbImg.src =
          "data:" +
          userDocument.userImage.contentType +
          ";base64," +
          userDocument.userImage.data;
        const faceMatch = await faceApiService.detect(img, dbImg);
        console.log("Euclidean Distance: ", faceMatch._distance);
        if (faceMatch._distance <= 0.5) {
          faceVerified = true;
          res.redirect("/");
        } else {
          res.render("user-recognition/webcam");
        }
      }
    });
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/groas",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    accountType = null;
    faceVerified = true;
    // Successful authentication, redirect to home.
    res.redirect("/");
  }
);

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/help", function(req, res) {
  res.render("help");
});

app.get("/listings/product/:id", function(req, res) {
  const id = req.params.id;
  console.log(req.params.id);

  if (userRole == "ADMIN") {
    User.findOne({ "listings._id": id }, "listings.$", function(
      err,
      foundListingList
    ) {
      if (err) {
        console.log(err);
      } else {
        console.log(foundListingList);

        User.findOne(
          { _id: req.user._id, "biddings.productId": id },
          "biddings.$",
          function(err, foundBiddingList) {
            if (err) {
              console.log(err);
            } else {
              console.log(foundBiddingList);
              res.render("admin/listing-detail-admin", {
                foundListingList: foundListingList,
                foundBiddingList: foundBiddingList,
              });
            }
          }
        );
      }
    });
  } else if (accountType == "seller") {
    var listings = req.user.listings;
    var product;
    for (var i = 0; i < listings.length && product == null; i++) {
      if (id == listings[i]._id) {
        product = listings[i];
      }
    }

    res.render("seller/listing-update-seller", {
      product: product,
    });
  } else if (accountType == "buyer") {
    User.findOne({ "listings._id": id }, "listings.$", function(
      err,
      foundListingList
    ) {
      if (err) {
        console.log(err);
      } else {
        console.log(foundListingList);

        User.findOne(
          { _id: req.user._id, "biddings.productId": id },
          "biddings.$",
          function(err, foundBiddingList) {
            if (err) {
              console.log(err);
            } else {
              console.log(foundBiddingList);
              res.render("buyer/listing-detail-buyer", {
                foundListingList: foundListingList,
                foundBiddingList: foundBiddingList,
              });
            }
          }
        );
      }
    });
  } else {
    res.render("account-type");
  }
});

//⇊-------------------For only seller-------------------------⇊//
app.get("/create-listing", function(req, res) {
  if (req.isAuthenticated()) {
    console.log(req.user._id);
    User.findById(req.user._id, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.render("seller/create-listing-seller");
      }
    });
  }
});

app.post("/create-listing/:productId", upload.single("image"), function(
  req,
  res
) {
  console.log(req.body);
  const productId = req.params.productId;
  console.log(productId);
  if (req.isAuthenticated()) {
    console.log("req.body: ", req.body);
    console.log("req.file: ", req.file);
    var reqFileName = req.file.filename;
    var obj;
    if (req.file != null) {
      obj = {
        name: req.file.originalname,
        img: {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.file.filename)
          ),
          contentType: req.file.mimetype,
        },
      };


      
    } else {
      User.findOne(
        { _id: req.user._id, "listings._id": productId },
        "listings.$",
        function(err, foundlist) {
          if (err) {
            console.log(err);
          } else {
            obj = foundlist.listings[0].productImage;
          }
        }
      );
    }
    var newListingObject = {
      productName: req.body.productName,
      productDescription: req.body.productDescription,
      productMinimumBid: req.body.productMinimumBid,
      productEndTime: req.body.productEndTime,
      productCategory: req.body.productCategory,
      productImage: obj,
    };

    if (productId == "new") {
      User.findById(req.user._id, function(err, foundList) {
        if (err) {
          console.log(err);
        } else {
          foundList.listings.push(newListingObject);

          foundList.save();

          // fs.unlink(
          //   path.join(__dirname + "/uploads/" + reqFileName),
          //   (err) => {
          //     if (err) {
          //       console.log(err);
          //     } else {
          //       console.log("file removed");
          //     }
          //   }
          // );

          res.redirect("/");
        }
      });
    } else {
      User.findOne(
        { _id: req.user._id, "listings._id": productId },
        "listings.$",
        function(err, oldListingUserDoc) {
          if (err) {
            console.log(err);
          } else {
            //creating a new merged document because $set in updates replaces a whole object with new and creates a new _id for the new object creating insconsistency so we use a merged object with everything assigned of old object so that no new get assigned during the replacement
            const newMergedListingObj = _.merge(
              oldListingUserDoc.listings[0],
              newListingObject
            );

            User.updateOne(
              { _id: req.user._id, "listings._id": productId },
              {
                $set: {
                  "listings.$": newMergedListingObj,
                },
              },
              {
                upsert: true,
              },
              function(err, foundlist) {
                if (err) {
                  console.log(err);
                } else {
                  res.redirect("/");
                }
              }
            );
          }
        }
      );
    }
  }
});

app.get("/remove-bidding/:biddingId", function(req, res) {
  const biddingId = req.params.biddingId;
  console.log(biddingId);

  if (req.isAuthenticated()) {
    if (userRole == "ADMIN") {
      console.log("removing bid");
      User.updateMany({}, { $pull: { biddings: { _id: biddingId } } }, function(
        err,
        foundlist
      ) {
        if (err) {
          console.log(err);
        } else {
          console.log("removed bidding so now rediredted to home");
          res.redirect("/");
          //todo: learn AJAX to refresh only some parts of webpage
        }
      });
    } else if (accountType == "seller") {
      User.findOne({ "biddings._id": biddingId }, "biddings.$", function(
        err,
        foundList
      ) {
        if (err) {
          console.log(err);
        } else {
          if (foundList.biddings[0].userId.toString == req.user._id.toString) {
            console.log("removing bid");
            User.updateMany(
              {},
              { $pull: { biddings: { _id: biddingId } } },
              function(err, foundlist) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("removed bidding so now rediredted to home");
                  res.redirect("/");
                  //todo: learn AJAX to refresh only some parts of webpage
                }
              }
            );
          }
        }
      });
    }
  }
});

app.get("/remove-listing/:productId", function(req, res) {
  console.log(req.body);
  const productId = req.params.productId;
  console.log(productId);
  if (req.isAuthenticated()) {
    if (userRole == "ADMIN") {
      console.log(req.user._id);
      User.updateMany({}, { $pull: { listings: { _id: productId } } }, function(
        err,
        foundlist
      ) {
        if (err) {
          console.log(err);
        } else {
          User.updateMany(
            {},
            { $pull: { biddings: { productId: productId } } },
            function(err, foundlist) {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  "removed listings and biddings so now rediredted to home"
                );
                res.redirect("/");
                //todo: learn AJAX to refresh only some parts of webpage
              }
            }
          );
        }
      });
    } else if (accountType == "seller") {
      console.log(req.user._id);

      User.findOne({ "listings._id": productId }, "listings.$", function(
        err,
        listingUserDocWhichUserIsDeleting
      ) {
        if (err) {
          console.log(err);
        } else {
          User.findByIdAndUpdate(
            req.user._id,
            { $pull: { listings: { _id: productId } } },
            function(err, foundlist) {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  "listingUserDocWhichUserIsDeleting",
                  listingUserDocWhichUserIsDeleting
                );
                //a condition here to only allow this action if its the listing owner
                if (
                  listingUserDocWhichUserIsDeleting._id.toString ==
                  req.user._id.toString
                ) {
                  User.updateMany(
                    {},
                    { $pull: { biddings: { productId: productId } } },
                    function(err, foundlist) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log(
                          "removed listings and biddings so now rediredted to home"
                        );
                        res.redirect("/");
                        //todo: learn AJAX to refresh only some parts of webpage
                      }
                    }
                  );
                }
              }
            }
          );
        }
      });
    }
  }
});

app.get("/listings/product-bidders-list/:id", function(req, res) {
  const id = req.params.id;
  console.log("productId", id);
  if (req.isAuthenticated()) {
    if (userRole == "ADMIN") {
      console.log(req.user._id);
      User.findOne({ "listings._id": id }, "listings.$", function(
        err,
        foundListingList
      ) {
        if (err) {
          console.log(err);
        } else {
          console.log(foundListingList);

          User.find({ "biddings.productId": id }, "name biddings.$", function(
            err,
            foundBiddingList
          ) {
            if (err) {
              console.log(err);
            } else {
              console.log("foundBiddingList: ", foundBiddingList);
              res.render("admin/bidders-list-admin", {
                listingDetail: foundListingList,
                biddingsDetails: foundBiddingList,
              });
            }
          });
        }
      });
    } else if (accountType == "seller") {
      console.log(req.user._id);
      User.findOne(
        { _id: req.user._id, "listings._id": id },
        "listings.$",
        function(err, foundListingList) {
          if (err) {
            console.log(err);
          } else {
            console.log(foundListingList);

            User.find({ "biddings.productId": id }, "name biddings.$", function(
              err,
              foundBiddingList
            ) {
              if (err) {
                console.log(err);
              } else {
                console.log("foundBiddingList: ", foundBiddingList);
                res.render("seller/bidders-list-seller", {
                  listingDetail: foundListingList,
                  biddingsDetails: foundBiddingList,
                });
              }
            });
          }
        }
      );
    }
  }
});

//⇈-------------------For only seller-------------------------⇈//

//⇊-------------------For only Buyyer-------------------------⇊//

app.get("/my-bids", function(req, res) {
  if (accountType == "buyer") {
    var biddingDetails = [];
    User.findById(req.user._id, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        console.log("foundUserBidsList: ", foundList.biddings);
        var foundUserBidsList = foundList.biddings;

        const foundListingListPromises = [];
        const biddingDetailsPromises = [];

        function foundListingListFinder(i) {
          return new Promise((resolve) => {
            console.log("Resolving " + i + " foundListingListPromise");

            resolve(
              User.findOne(
                { "listings._id": foundUserBidsList[i].productId },
                "listings.$"
              ).exec()
            );
          });
        }

        function biddingDetailsCreator(i, foundListingList) {
          return new Promise((resolve) => {
            console.log("Resolving " + i + " biddingDetailsPromise");

            function test() {
              var obj = {
                productImage: foundListingList.listings[0].productImage,
                productName: foundListingList.listings[0].productName,
                productCategory: foundListingList.listings[0].productCategory,
                productDescription:
                  foundListingList.listings[0].productDescription,
                productEndTime: foundListingList.listings[0].productEndTime,
                productBid: foundList.biddings[i].productBid,
                productId: foundList.biddings[i].productId,
              };
              return obj;
            }

            resolve(test());
          });
        }

        for (let i = 0, len = foundUserBidsList.length; i < len; i++) {
          foundListingListPromises.push(foundListingListFinder(i));
        }

        Promise.all(foundListingListPromises)
          .then((foundListingList) => {
            console.log("foundListingList: ", foundListingList);
            for (let i = 0, len = foundUserBidsList.length; i < len; i++) {
              biddingDetailsPromises.push(
                biddingDetailsCreator(i, foundListingList[i])
              );
            }

            Promise.all(biddingDetailsPromises)
              .then((biddingDetails) => {
                console.log("biddingDetails: ", biddingDetails);
                res.render("buyer/my-bids", {
                  biddingDetails: biddingDetails,
                });
              })
              .catch((e) => {
                // handle errors here
              });
          })
          .catch((e) => {
            // handle errors here
          });
      }
    });
  } else {
    res.redirect("/");
  }
});

app.post("/create-bid/:id", function(req, res) {
  const id = req.params.id;
  if (accountType == "buyer" && req.isAuthenticated()) {
    console.log(req.body);
    User.findOne({ "listings._id": id }, "listings.$", function(
      err,
      foundList
    ) {
      if (err) {
        console.log(err);
      } else {
        //creating a new bidding object
        var bidding = {
          userId: foundList._id,
          productId: id,
          productBid: req.body.productBid,
          bidTime: new Date(),
        };

        console.log(bidding);
        console.log(req.user._id);

        User.findOne({ _id: req.user._id, "biddings.productId": id }, function(
          err,
          foundUserList
        ) {
          console.log("foundUserList: ", foundUserList);
          if (err) {
            console.log(err);
          } else if (!foundUserList) {
            console.log("pushed new bid");
            User.findById(req.user._id, function(err, foundUserList) {
              if (err) {
                console.log(err);
              } else {
                foundUserList.biddings.push(bidding);
                foundUserList.save();
                res.redirect("/");
              }
            });
          } else {
            console.log("updated old bid");

            User.findOne(
              { _id: req.user._id, "biddings.productId": id },
              "biddings.$",
              function(err, oldBiddingUserDoc) {
                if (err) {
                  console.log(err);
                } else {
                  //creating a new merged document because $set in updates replaces a whole object with new and creates a new _id for the new object creating insconsistency so we use a merged object with everything assigned of old object so that no new get assigned during the replacement
                  const newMergedBiddingObj = _.merge(
                    oldBiddingUserDoc.biddings[0],
                    bidding
                  );

                  User.updateOne(
                    { _id: req.user._id, "biddings.productId": id },
                    {
                      $set: {
                        "biddings.$": newMergedBiddingObj,
                      },
                    },
                    {
                      upsert: true,
                    },
                    function(err, foundlist) {
                      if (err) {
                        console.log(err);
                      } else {
                        res.redirect("/");
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    });
  } else {
    res.redirect("/");
  }
});

//⇈-------------------For only Buyyer-------------------------⇈//

app.get("/login", function(req, res) {
  isLoggedIn = req.isAuthenticated();
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});

app.get("/register", function(req, res) {
  isLoggedIn = req.isAuthenticated();
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    res.render("register");
  }
});

app.post("/", function(req, res) {
  isLoggedIn = req.isAuthenticated();
  if (req.body.accountType != null) accountType = req.body.accountType;
  res.redirect("/");
});

app.get("/logout", function(req, res) {
  req.logout();
  accountType = null;
  faceVerified = null;
  res.redirect("/");
});

app.post("/register", function(req, res) {
  User.register(
    { email: req.body.email, name: req.body.name, role: "USER" },
    req.body.password,
    function(err) {
      if (err) {
        console.log("error message: ", err.message);
        const alerts = [];
        alerts.push(err.message);
        res.render("register", {
          alerts: alerts,
        });
      } else {
        passport.authenticate("local")(req, res, function() {
          // Create a verification token for this user
          var token = new Token({
            _userId: req.user._id,
            token: crypto.randomBytes(16).toString("hex"),
          });

          // Save the verification token
          token.save(function(err) {
            if (err) {
              console.log("msg: ", err);
            }

            // Send the email using sendgrid Web API or SMTP Relay
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
              to: req.body.email, // Change to your recipient
              from: "deepanshuc2001@gmail.com", // Change to your verified sender
              subject: "Account Verification Token",
              text:
                "Hello,\n\n" +
                "Please verify your account by clicking the link: \n" +
                "http://" +
                req.headers.host +
                "/confirmation/" +
                token.token,
              // html: "<strong>and easy to do anywhere, even with Node.js</strong>",
            };
            sgMail
              .send(msg)
              .then(() => {
                console.log("Email sent");
                accountType = null;
                isLoggedIn = req.isAuthenticated();
                faceVerified = null;
                if (req.isAuthenticated()) {
                  userRole = req.user.role;
                  res.render("user-recognition/webcam");
                } else {
                  res.redirect("/register");
                }
              })
              .catch((error) => {
                console.error(error);
              });
          });
        });
      }
    }
  );
});

app.get("/verification-status/:status", function(req, res) {
  accountType = null;
  isLoggedIn = req.isAuthenticated();

  if (req.isAuthenticated()) {
    userRole = req.user.role;

    if (req.user.emailVerified) {
      res.redirect("/");
    } else {
      if (req.params.status == "pending") {
        res.render("user-verification/user-verification-pending");
      } else if (req.params.status == "already-verified") {
        res.render("user-verification/verified", { msg: "Already verified" });
      } else if (req.params.status == "verified") {
        res.render("user-verification/verified", { msg: "Verified" });
      }
    }
  } else {
    userRole = "USER";
    if (req.params.status == "pending") {
      res.render("user-verification/user-verification-pending");
    } else if (req.params.status == "already-verified") {
      res.render("user-verification/verified", { msg: "Already verified" });
    } else if (req.params.status == "verified") {
      res.render("user-verification/verified", { msg: "Verified" });
    }
  }
});

app.get("/confirmation/:token", function(req, res) {
  const token = req.params.token;
  isLoggedIn = req.isAuthenticated();

  Token.findOne({ token: token }, function(err, tokenDocument) {
    if (err) {
      console.log(err);
    } else if (!tokenDocument) {
      console.log(
        "We were unable to find this token. Your token may have expired."
      );
      // tell user that this token is not found and might have expired so redner a page with this message and a button which leads to resend token page
      res.render("user-verification/token-not-exist");
    } else {
      res.render("user-verification/user-confirmation", { token: token });
    }
  });
});

app.post(
  "/confirmation/:token",
  [
    body("email", "Email is not valid")
      .exists()
      .trim()
      .normalizeEmail()
      .isEmail(),
  ],
  function(req, res) {
    Token.findOne({ token: req.params.token }, function(err, tokenDocument) {
      if (err) {
        console.log(err);
      } else {
        User.findOne(
          { _id: tokenDocument._userId, email: req.body.email },
          function(err, userDocument) {
            console.log("userDocument : ", userDocument);
            if (err) {
              console.log(err);
            } else if (!userDocument) {
              console.log(
                "This token is not registered with your provided email. "
              );

              const result = validationResult(req);
              const alerts = [];
              console.log(result);
              var errors = result.errors;
              for (var i = 0; i < errors.length; i++) {
                alerts.push(errors[i].msg);
                console.log("error msgs: ", errors[i].msg);
              }

              alerts.push(
                "This token is not registered with your provided email."
              );

              res.render("user-verification/user-confirmation", {
                token: req.params.token,
                alerts: alerts,
              });

              // keep on the same page and ask to re enter correct email for this token
            } else if (userDocument.emailVerified) {
              console.log("This user has already been verified.");

              res.redirect("/verification-status/already-verified");

              // in this case redirect user to already verified page
            } else {
              userDocument.emailVerified = true;
              userDocument.save();
              console.log("The account has been verified. Please log in.");

              res.redirect("/verification-status/verified");

              // in this case redirect user to verified page with button to redirect to home directory
            }
          }
        );
      }
    });
  }
);

app.get("/resend-token", function(req, res) {
  isLoggedIn = req.isAuthenticated();
  res.render("user-verification/resend-verification-token");
});

app.post(
  "/resend-token",
  [
    body("email", "Email is not valid")
      .exists()
      .trim()
      .normalizeEmail()
      .isEmail(),
  ],
  function(req, res) {
    isLoggedIn = req.isAuthenticated();

    User.findOne({ email: req.body.email }, function(err, userFound) {
      if (err) {
        console.log(err);
      } else if (!userFound) {
        console.log("We were unable to find a user with that email.");

        const result = validationResult(req);
        const alerts = [];
        console.log(result);
        var errors = result.errors;
        for (var i = 0; i < errors.length; i++) {
          alerts.push(errors[i].msg);
          console.log("error msgs: ", errors[i].msg);
        }

        alerts.push("We were unable to find a user with that email.");

        res.render("user-verification/resend-verification-token", {
          alerts: alerts,
        });
      } else if (userFound.emailVerified) {
        console.log("This account has already been verified. Please log in.");
        // in this case redirect user to already verified page

        res.redirect("/verification-status/already-verified");
      } else {
        // Create a verification token for this user
        var token = new Token({
          _userId: userFound._id,
          token: crypto.randomBytes(16).toString("hex"),
        });

        // Save the verification token
        token.save(function(err) {
          if (err) {
            console.log("msg: ", err);
          }

          // Send the email using sendgrid Web API or SMTP Relay
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const msg = {
            to: req.body.email, // Change to your recipient
            from: "deepanshuc2001@gmail.com", // Change to your verified sender
            subject: "Account Verification Token",
            text:
              "Hello,\n\n" +
              "Please verify your account by clicking the link: \n" +
              "http://" +
              req.headers.host +
              "/confirmation/" +
              token.token,
            // html: "<strong>and easy to do anywhere, even with Node.js</strong>",
          };
          sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");

              res.redirect("/verification-status/pending");
            })
            .catch((error) => {
              console.error(error);
            });
        });
      }
    });
  }
);

app.post("/login", function(req, res) {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
  });

  passport.authenticate("local", function(err, user, info) {
    if (err) {
      console.log("error message: ", err);
    } else if (!user) {
      var alerts = [];
      alerts.push("Username or password entered was incorrect");
      res.render("login", { alerts: alerts });
    } else {
      req.login(user, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log(req.user);
          accountType = null;
          faceVerified = null;
          isLoggedIn = req.isAuthenticated();
          if (req.isAuthenticated()) {
            userRole = req.user.role;
            res.render("user-recognition/webcam");
          } else {
            res.redirect("/login");
          }
        }
      });
    }
  })(req, res);
});

let port = process.env.PORT || 5000;

app.listen(port, function() {
  console.log("Server started successfully at " + port + ".");
  if (process.env.NODE_ENV == "devlopment") {
    console.log("Current url- ", "http://localhost:" + port);

    //logs current url on opening website so useful if we want current url inside website. also this requires request to work which we can only get once this website any url is typed
    //console.log("Current url- ", req.protocol + "://" + req.headers.host);
  }
});
