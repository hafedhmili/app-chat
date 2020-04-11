const socket = io()

// elements from GUI
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

const locationTemplate = document.querySelector('#location-template').innerHTML

const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// options

const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix: true})


$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    // this assumes that there is a single field called input 
    // const message = document.querySelector('input').value
    // a much better way is to refer to the input fioeld: 1) by
    // ID, and 2) by navigating from the event e. 
    // e.target refers to the view that emitted the event, i.e. the form
    // e.target.elements refers to the elements of the form.
    // we can refer to a component of the form by elements.<name>
    // We called the input field 'message'

    const message = e.target.elements.message.value

    // disable the send button until I get acknowledgment
    $messageFormButton.setAttribute('disabled','disabled')


    console.log('just submitted a message: '+message)

    // next is the simple form of emit. 
    // socket.emit('sendMessage',message)
    // If I want an acknowledgement from the receiver (server in this
    // case) that the message was received, I need to supply a callback function as 
    // the last argugment to emit
    socket.emit('sendMessage',message, (error) => {

     
        // re-enable the send button    
        $messageFormButton.removeAttribute('disabled')

        // reset the input field and get the focus back on it
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
}
)

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(messageObject) => {
    console.log('New message received from server: ',messageObject)
    const html = Mustache.render(messageTemplate, {
        username: messageObject.username,
        createdAt: moment(messageObject.createdAt).format('h:mm a'),
        message: messageObject.text
    })
    $messages.insertAdjacentHTML('beforeend',html)
    
    autoscroll();
})

socket.on('locationMessage',(locationMessage) => {
    console.log('New location received from server: ',locationMessage)

    const html = Mustache.render(locationTemplate,{
        username: locationMessage.username,
        URL: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    
    autoscroll()

})

socket.on('roomData', (roomData) => {
    console.log('New data for room: ',roomData.room)
    console.log('Users in the room: ',roomData.users)

    const html = Mustache.render(sidebarTemplate, {
        room: roomData.room,
        users: roomData.users
    })

    document.querySelector('#sidebar').innerHTML = html

})


$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    // disable send location button
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        console.log('current position is ',position)
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

 
        // old form:
        // socket.emit('sendLocation',location)
        // now, I am adding an acknowledgement callback 
        // function as a third argument that simply says
        // that locstion was shared
        socket.emit('sendLocation',location,() => {
            console.log('Location shared!')

            // re-enable the send location button
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})


// will add a call back function that the server should 
// invoke if I can't join the room
socket.emit('join', {username, room},(error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }

})