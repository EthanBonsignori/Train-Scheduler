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

$(document).on('click', '#submit', function (event) {
  checkInputValidity()
  event.preventDefault()

  // Get user input
  let trainName = $('#train-name').val().trim()
  let destination = $('#train-destination').val().trim()
  let firstArrival = $('#train-first-arrival').val().trim()
  let frequency = $('#train-frequency').val().trim()

//   // Push input to firebase
//   dataRef.ref().push({
//     trainName: trainName,
//     destination: destination,
//     firstArrival: firstArrival,
//     frequency: frequency,
//     dateAdded: firebase.database.ServerValue.TIMESTAMP
//   })
})

// Firebase watcher + initial loader HINT: .on("value")
dataRef.ref().on('child_added', function (snapshot) {
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
  newRow.append(`<td>${snap.val().trainName}</td>`)
  newRow.append(`<td>${snap.val().destination}</td>`)
  newRow.append(`<td>${snap.val().frequency}</td>`)
  newRow.append(`<td>${minutesAway}</td>`)
  newRow.append(`<td>${nextArrival}</td>`)
  $('#train-table').append(newRow)
}

const getTrainTime = (first, freq) => {
  // First Time (pushed back 1 year to make sure it comes before current time)
  let firstTimeConverted = moment(first, 'HH:mm').subtract(1, 'years')
  console.log(firstTimeConverted)
  // Current Time
  let currentTime = moment()
  console.log(`CURRENT TIME: ${moment(currentTime).format('hh:mm')}`)
  // Difference between the times
  let diffTime = moment().diff(moment(firstTimeConverted), 'minutes')
  console.log(`DIFFERENCE IN TIME: ${diffTime}`)
  // Time apart (remainder)
  let remainder = diffTime % freq
  // Minute(s) Until Train
  let minsUntil = freq - remainder
  console.log(`MINUTES TILL TRAIN: ${minsUntil}`)
  // Next Train
  let nextTrain = moment().add(minsUntil, 'minutes')
  let nextTrainConverted = moment(nextTrain).format('hh:mm A')
  console.log(`ARRIVAL TIME: ${nextTrainConverted}`)

  return [minsUntil, nextTrainConverted]
}

let checkInputValidity = () => {
  let form = $('form')[0]
  let name = $('#train-name')
  let error = $('.error')

  form.on('submit', function (event) {
    // Each time the user tries to send the data, we check if the name field is valid.
    if (!name.validity.valid) {
      // If the field is not valid, we display a custom error message.
      error.innerHTML = 'Enter a name with 1-20 characters'
      error.className = 'error active'
      // And we prevent the form from being sent by canceling the event
      event.preventDefault()
    }
  }, false)
}

// Set audio volume low
let audio = document.getElementById('audio')
audio.volume = 0.1
// Mute / Unmute the audio on click
$(document).on('click', '#audio-toggle', function () { 
  $(this).toggleClass('play')
  $(this).toggleClass('fa-volume-up')
  if (!$(this).hasClass('play')) {
    audio.volume = 0;
  } else {
    audio.volume = 0.1;
  }
})
