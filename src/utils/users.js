const users = []

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({id, username, room}) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room required!'
        }
    }

    // check for existing user
    const existingUser = users.find((user)=> {
        return (user.room === room && user.username === username)
    })

    // Validate user name
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // store user
    const user = {id,username,room}
    users.push(user)
    return {user}

}

// remove user function
const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id
    })

    if (index!==-1) {
        // removes n elements starting at index, where n
        // is the second argument. Here n = 1. The function
        // returns
        return users.splice(index,1)[0]
    }

}

// get user by ID
const getUser = (id) => {
    return users.find((user) => user.id === id)
}


// get users in room
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}


// let user = addUser({id:22, username: 'Khalil',room: 'salon'})
// console.log('just added', user)

// user = removeUser(22)
// console.log('just removed', user)


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}