// Init audio selectors
let trainAudio = document.getElementById('audio')
let midnightTrain = document.getElementById('midnight-train')

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyC9BcuqTuIWCyiocc7J-Uichf_emz1aZy4',
  authDomain: 'bootcamp-2019.firebaseapp.com',
  databaseURL: 'https://bootcamp-2019.firebaseio.com',
  projectId: 'bootcamp-2019',
  storageBucket: 'bootcamp-2019.appspot.com',
  messagingSenderId: '637420148992'
}

firebase.initializeApp(config)
let dataRef = firebase.database()
console.log(dataRef.ref('bootcamp-2019/'))

$(document).on('click', '#submit', function (event) {
  event.preventDefault()
  
  // Get user inputj
  let trainName = $('#train-name').val().trim()
  let destination = $('#train-destination').val().trim()
  let firstArrival = $('#train-first-arrival').val().trim()
  let frequency = $('#train-frequency').val().trim()
  // Check the user input
  let inputValid = checkValidity(trainName, destination, firstArrival, frequency)
  // Only continue if the checkValidity() function returns true
  if (inputValid) {
    // Push input to firebase
    dataRef.ref().push({
      trainName: trainName,
      destination: destination,
      firstArrival: firstArrival,
      frequency: frequency,
      dateAdded: firebase.database.ServerValue.TIMESTAMP
    })
    inputFormAnimate($(this))
  }
})

// Holds train names so they cannot be re-used
let trainNames = []
// Firebase watcher for new child
dataRef.ref().on('child_added', function (snapshot) {
  trainNames.push(snapshot.val().trainName.toLowerCase())
  console.log('---- Used Train Names ----')
  console.log(trainNames)
  updateTrains(snapshot)
  // On error,
}, function (errorObject) {
  console.log(`Errors on child_added: ${errorObject.code}`)
})

let updateTrains = (snap) => {
  let first = snap.val().firstArrival
  let freq = snap.val().frequency
  // Returns converted time values
  let times = getTrainTime(first, freq)
  let nextArrival = times[0]
  let minutesAway = times[1]
  // Add train to train schedule table
  let newRow = $('<tr>')
  newRow.append(`<td><div contenteditable>${snap.val().trainName}</div></td>`)
  newRow.append(`<td>${snap.val().destination}</td>`)
  newRow.append(`<td>${snap.val().frequency}</td>`)
  newRow.append(`<td>${minutesAway}</td>`)
  newRow.append(`<td>${nextArrival}</td>`)
  $('#train-table').append(newRow)
}

// Calculate next time the train will arrive and how many minutes away
const getTrainTime = (first, freq) => {
  // First Time (pushed back 1 year to make sure it comes before current time)
  let firstTimeConverted = moment(first, 'HH:mm').subtract(1, 'years')
  // Difference between the times
  let diffTime = moment().diff(moment(firstTimeConverted), 'minutes')
  // Time apart (remainder)
  let remainder = diffTime % freq
  // Minute(s) Until Train
  let minsUntil = freq - remainder
  // Next Train
  let nextTrain = moment().add(minsUntil, 'minutes')
  let nextTrainConverted = moment(nextTrain).format('hh:mm A')
  return [minsUntil, nextTrainConverted]
}

// Only allows train to be added if it meets necessary requirements
let checkValidity = (name, dest, first, freq) => {
  // Select the error html elements for each input field
  let nameErr = $('#name-error')
  let destErr = $('#dest-error')
  let timeErr = $('#time-error')
  let freqErr = $('#freq-error')
  // Will count up for each error and only allow the script to continue if there are 0 errors
  let err = 0
  // Check Train Name input
  if (trainNames.indexOf(name.toLowerCase()) > -1) {
    nameErr.text(' That train already exists! ')
    nameErr.addClass('active')
    err++
  } else if (name === '' || name.length < 3) {
    nameErr.text(' Train Name is required. (3-20 Characters) ')
    nameErr.addClass('active')
    err++
  } else {
    nameErr.text('')
    nameErr.removeClass('active')
  }
  // Check Destination input
  if (dest === '' || dest.length < 3) {
    destErr.text(' Destination is required. (3-20 Characters) ')
    destErr.addClass('active')
    err++
  } else {
    destErr.text('')
    destErr.removeClass('active')
  }
  // Play midnight train if destination includes ga or georgia
  // update the subtitle so it reads 'Midnight Train to Georgia'
  let lcDest = dest.toLowerCase()
  if ( lcDest.includes('ga') || lcDest.includes('georgia') ) {
    $('#subtitle').text('to Georgia!')
    trainAudio.pause()
    midnightTrain.volume = 1
    midnightTrain.play()
  }
  // Check First Arrival input
  // regex (for when browsers don't support <input type="time">)
  const timeRegex = RegExp('^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$')
  let checkTime = timeRegex.test(first)
  if (first === '') {
    timeErr.text(' First Arrival is required. (HH:mm) ')
    timeErr.addClass('active')
    err++
  } else if (!checkTime) {
    timeErr.text(' First Arrival must be typed in military time (HH:mm) ')
    timeErr.addClass('active')
    err++
  } else {
    timeErr.text('')
    timeErr.removeClass('active')
  }
  // Check Frequency input
  if (freq === '') {
    freqErr.text(' Frequency is required. (1-60) ')
    freqErr.addClass('active')
    err++
  } else if (freq > 60 || freq < 1) {
    freqErr.text(' Frequency must be between 1 and 60 ')
    freqErr.addClass('active')
    err++
  } else {
    freqErr.text('')
    freqErr.removeClass('active')
  }
  // If any errors exist, do not continue pushing to firebase
  if (err > 0) {
    return false
  } else {
    return true
  }
}

$(document).on('click', '.error', function () {
  $(this).text('')
  $(this).removeClass('active')
}) 

// Mute / Unmute the audio on click
$(document).on('click', '#audio-toggle', function () {
  $(this).toggleClass('play')
  $(this).toggleClass('fa-volume-up')
  if (!$(this).hasClass('play')) {
    trainAudio.volume = 0
    midnightTrain.volume = 0
  } else {
    trainAudio.volume = 0.08
    midnightTrain.volume = 0.7
  }
})

// Animate submit train
let inputFormAnimate = (btn) => {
  console.log('registerd')
  $('.send-animate').addClass('is-sent')
  setTimeout(function () {
    $('.send-animate').removeClass('is-sent')
  }, 1800)
}

// Initialize audio
// Set audio volume very low (background noise)
trainAudio.volume = 0.08
// Play the train noise when Midnight train ends
midnightTrain.addEventListener('ended', function () {
  $('#subtitle').text('to wherever')
  trainAudio.play()
})

// Add some placeholder to the first arrival inpu0t
document.getElementById('train-first-arrival').value = moment().format('HH:mm')
