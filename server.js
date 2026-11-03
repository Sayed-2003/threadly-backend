// imports
const connectToDB = require('./config/db.js')
const express = require("express") //importing express package
const app = express() // creates a express application
const dotenv = require("dotenv").config() //this allows me to use my .env values in this file
const morgan = require('morgan')
const cors = require('cors')


// Routes Import
const authRoutes = require('./routes/auth.routes')
const communityRoutes = require("./routes/community-routes/communities.routes.js");
const postsRouter = require('./routes/posts-routes/posts.routes.js');
const commentsRouter = require('./routes/comment-routes/comment.routes.js');
const votesRouter = require('./routes/vote-routes/vote.routes.js')
const bookmarksRouter = require("./routes/bookmarks-routes/bookmarks.routes.js");



// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
    })
);
app.use(express.json())
app.use(morgan('dev'))



// Routes
app.use('/auth',authRoutes)
app.use("/communities", communityRoutes);
app.use("/posts", postsRouter);
app.use("/posts/:postId/comments", commentsRouter);
app.use("/posts/:postId", votesRouter);
app.use("/bookmarks", bookmarksRouter);

// connect to database and listen on Port 3000
async function startServer() {
    const PORT = process.env.PORT || 3000;
    await connectToDB();

    app.listen(PORT, () => {
        console.log(`App is running on port ${PORT}`);
    });
}
startServer();