const generateMessage = (userName,messageText) => {
    return {
        username: userName,
        text: messageText,
        createdAt: new Date().getTime()
    }
}

const generateTimedLocationMessage = (username,url) => {
    return {
        username,
        url: url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage, generateTimedLocationMessage
}