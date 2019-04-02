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
  event.preventDefault()

  // Get user input
  let trainName = $('#train-name').val().trim()
  let destination = $('#train-destination').val().trim()
  let firstArrival = $('#train-first-arrival').val().trim()
  let frequency = $('#train-frequency').val().trim()

  $(':input').map(function () {
    var errors = 0
    if (!$(this).val()) {
      $(this).parents('td').addClass('warning')
      errors++
    } else if ($(this).val()) {
      $(this).parents('td').removeClass('warning')
    }
    if (errors > 0) {
      $('#errorwarn').text('All fields are required')
      return false
    }
  })

  // Push input to firebase
  dataRef.ref().push({
    trainName: trainName,
    destination: destination,
    firstArrival: firstArrival,
    frequency: frequency,
    dateAdded: firebase.database.ServerValue.TIMESTAMP
  })
})

// Firebase watcher + initial loader HINT: .on("value")
dataRef.ref().on('child_added', function (snapshot) {
  let first = snapshot.val().firstArrival
  let freq = snapshot.val().frequency
  // Returns converted time values
  let times = getTrainTime(first, freq)
  let nextArrival = times[0]
  let minutesAway = times[1]

  // Add train to train schedule table
  let newRow = $('<tr>')
  newRow.append(`<td>${snapshot.val().trainName}</td>`)
  newRow.append(`<td>${snapshot.val().destination}</td>`)
  newRow.append(`<td>${snapshot.val().frequency}</td>`)
  newRow.append(`<td>${minutesAway}</td>`)
  newRow.append(`<td>${nextArrival}</td>`)
  $('#train-table').append(newRow)

  // On error,
}, function (errorObject) {
  console.log(`Errors handled: ${errorObject.code}`)
})

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
  let nextTrainConverted = moment(nextTrain).format('hh:mm')
  console.log(`ARRIVAL TIME: ${nextTrainConverted}`)

  return [minsUntil, nextTrainConverted]
}
