var express         = require('express'),
    PORT            = process.env.PORT || 3001,
    server          = express(),
    MONGOURI        = process.env.MONGOLAB_URI || "mongodb://localhost:27017",
    dbname          = "some_useful_name",
    mongoose        = require('mongoose'),
    Schema          = mongoose.Schema,
    ejs             = require('ejs'),
    expressLayouts  = require('express-ejs-layouts'),
    bodyParser      = require('body-parser'),
    methodOverride  = require('method-override'),
    session         = require('express-session');

var threadSchema = new Schema({
  title: { type: String, //required: true
  },
  author: { type: String, //required: true
  },
  date: Date,
  body: { type: String, //required: true
  },
  //comments: [{ author: String, body: String, date: Date }]
  comments: [String]
}, {collection: 'forum_thread_list', strict: true});

var Thread = mongoose.model(null, threadSchema);

var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true}
}, {strict: true});

var User = mongoose.model("User", userSchema);

server.get('/secret-test', function (req, res) {
  res.write("Welcome to this app bitchezzzzzz");
  res.end();
});

mongoose.connect(MONGOURI + "/" + dbname);
server.listen(PORT, function () {
  console.log("Server is running on PORT: ", PORT);
});

server.set('views', './views');
server.set('view engine', 'ejs');

server.use(session({
  secret: "thisismysecretysecretduuudeyou'renevergonnafindthisoutsodonteventryyyn00000b",
  resave: true,
  saveUninitialized: false
}));

server.use(express.static('./public'));
server.use(expressLayouts);
server.use(methodOverride('_method'));

server.use(bodyParser.urlencoded({ extended: true }));

// server.use(function (req, res, next) {
//   console.log("REQ DOT BODY", req.body);
//   console.log("REQ DOT SESSION", req.session);
//
//   next();
// });

server.get('/thread', function (req, res) {
  Thread.find({}, function (err, allThreads) {
    res.render('logged_in_home_page', {
      threads: allThreads
    });
  })
});

server.get('/threads/new', function (req, res) {
  if (req.session.user == undefined) {
    res.render('login');
  } else {
    res.render('newthread', { author: req.session.user.name });
  }
});

server.patch('/threads/:id/comments', function (req, res) {

  var threadComments = {$push: {comments: req.body.thread.comments}}

  Thread.findByIdAndUpdate(req.params.id, threadComments, function (err, threadWithComment) {
    if (err) {
      console.log(err)
    } else {
      res.redirect(302, "/threads/" + threadWithComment._id);
    }
  });
});

server.patch('/threads/:id/edit', function (req, res) {
  var threadEdit = req.body.thread;

  Thread.findByIdAndUpdate(req.params.id, threadEdit, function (err, updatedThread) {
    if (err) {
      console.log(err);
    } else {
      res.redirect(302, "/threads/" + updatedThread._id);
    }
  });
});

server.delete('/threads/:id', function (req, res) {
  Thread.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      console.log(err);
    } else {
      if (req.session.user) {
        res.redirect(302, '/thread');
      } else {
        res.redirect(302, '/');
      };
    }
  });
});

server.get('/threads/:id', function (req, res) {
  Thread.findById(req.params.id, function (err, aSpecificThread) {
    if (err) {
      console.log(err)
    } else {
      res.render('showthread', {
        thread: aSpecificThread,
        // author: aSpecificThread.author
      });
    }
  });
});

server.get('/login', function (req, res) {
  res.render('login');
})

server.post('/login', function (req, res) {
  var attempt = req.body.user;
  console.log("_________________________");
  console.log(attempt);
  console.log("_________________________");
  User.findOne({ username: attempt.name }, function (err, user) {
    if (err) {
      console.log(err);
    } else if (user && user.password === attempt.password) {
      req.session.user = user;
      res.redirect(302, "/thread");
    } else {
      res.redirect(302, '/login');
    };
  });
});

server.post('/', function (req, res, next) {
  req.session.user = req.body.user
//   if (req.session.user == undefined) {
//     res.redirect(302, "/login");
//   } else {
//     next();
//   }
console.log(req.session)
res.redirect(302, '/thread')
});

server.get('/register', function (req, res) {
  res.render('register');
});

server.post('/register', function (req, res) {
  var newUser = User(req.body.user);
  newUser.save(function (err, userRandom) {
    console.log("!!!!!!!!!");
    console.log(newUser);
    console.log("!!!!!!!!!");
    if (err) {
      console.log(err);
    } else {
    res.redirect(302, "/login");
    }
  });
});

server.get('/', function (req, res) {
  console.log(req.session);
  Thread.find({}, function (err, allThreads) {
    if (err) {
      console.log(err)
    } else {
      res.render('homepage', {
      threads: allThreads
      });
    }
  });
});

server.post('/thread', function (req, res) {
  // if (req.body.thread == undefined) {
  //   console.log("what is going on" + req.session, req.body);
  //   res.redirect(302, "/");
  // } else {
  var newThread = new Thread({
    // req.body.thread
    title: req.body.thread.title,
    author: req.session.user.name,
    body: req.body.thread.body,
    date: req.body.thread.date
  });
  newThread.save(function (err, newThreadSaved) {
    if (err) {
      console.log(err);
    } else {
      res.redirect(302, "/thread");
    }
  });
});
