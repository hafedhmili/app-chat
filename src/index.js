const {generateMessage, generateTimedLocationMessage} = require('./utils/messages')

const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const http = require('http')

const express = require('express')

const path = require('path')

const Filter = require('bad-words')

const app = express()

const socketio = require('socket.io')

const server = http.createServer(app)

const io = socketio(server)

const port = process.env.PORT || 3000

console.log(__dirname)

// Define paths for express config
const publicDirectoryPath = path.join(__dirname,'../public')




// this tells express that our application will serve static
// html files with the root at publicDirectoryPath.
// then, anytime we use a root in the browser, we look
// for a file index.html within a directory that corresponds
// to the route, and display it. If we don't find a corresponding
// <route>/index.html (either no directory corresponding to the route
// or no index.html file), then we rely on the programmatically configured
// routes like the one for weather.
//
// ALTERNATIVELY, I could create a file called, e.g., help.html in the root
// public directory, but then to access it, we need to spell out the full name
// of the file, i.e. with extension, as in "http://localhost:3000/help.html"
//
// Personally, I prefer creating a directory with the same name as the root,
// and putting an index file inside.
// 
app.use(express.static(publicDirectoryPath))

// let count = 0

io.on('connection',(socket) => {
    console.log('New WebSocket Connection')

    // emit welcome message


    socket.on('join',(joinMessage, callback) => {

        // now, I hate this, but will follow along
        // 
        const result  = addUser({
            id: socket.id,
            username: joinMessage.username,
            room : joinMessage.room
        })

        if (result.error) {
            return callback(result.error)
        }


        // socket.join(joinMessage.room)
        // I could use the stored version which wasd trimmed and converted to lower case
        // and I do the same thing for the other references to username and room
        socket.join(result.user.room)

        // emit welcome message
        socket.emit('message', generateMessage('Admin',"Welcome to the chat app!"))

        socket.broadcast.to(result.user.room).emit('message', generateMessage('Admin',`${result.user.username} has joined!`))

        // here, when a new user joins, I emit an event to all users in the room to update
        // them with the list of users in the room, including the new user
        io.to(result.user.room).emit('roomData', {
            room: result.user.room,
            users: getUsersInRoom(result.user.room)
        })

        callback()

    })


    // this is the receive format without acknowledgement call back
    //     socket.on('sendMessage',(message)=>{
    // the one with acknowledgement takes another argument beside message
    // the callback function can take as many arguments as I want. here, we assume
    // it takes a single string argument

    socket.on('sendMessage',(message,callback)=>{

        // get the user's room
        const user = getUser(socket.id)

        const room = user.room

        console.log('Received the message: ' + message + ' from: ' + user.username)

        // broadcast to every one
        const filter = new Filter()

        if (filter.isProfane(message)){
            return callback('No profanity you fucking moron!')
        }
        io.to(room).emit('message',generateMessage(user.username,message))

        // what I can do. Instead of calling callback with an argument when things go
        // well, I can call back with no argument. Then, the sender checks if the argument is null
        // and interprets it as an error
        // callback('Received 5 sur 5')
        callback()
    })


    socket.on('sendLocation', (location, ackCallback) => {
//        const message = "Location: " + location.latitude +", " + location.longitude
// instead of sharing the GPS coordinates, I will share the actual location using 
// google maps. The URL for that is https://google.com/maps?q=lat,long
// further, I will the ES 6 template string format
        const message = `https://google.com/maps?q=${location.latitude},${location.longitude}`
    
        // get the user's room
        const user = getUser(socket.id)

        const room = user.room

        io.to(room).emit('locationMessage', generateTimedLocationMessage(user.username,message))
        ackCallback()
    })

    // here, I should remove the user after they disconnect
    socket.on('disconnect',()=> {

        //console.log('Socket ID at disconnect: ', socket.id)
        const user = removeUser(socket.id)

        console.log('the user to be removed is', user)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`User ${user.username} just left!`))

            // here, when a new user leaves, I emit an event to all users in the room to update
            // them with the list of users in the room, including the new user
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port,() => {
    console.log('server is up on port '+port)
})
