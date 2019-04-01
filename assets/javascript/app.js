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
  let trainName =    $('#train-name').val().trim()
  let destination =  $('#train-destination').val().trim()
  let firstArrival = $('#train-first-arrival').val().trim()
  let frequency =    $('#train-frequency').val().trim()

  let nextArrival = 'func()'
  let minutesAway = 'func()'

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
  // Log everything that's coming out of snapshot
  console.log(snapshot.val())
  console.log(snapshot.val().trainName)
  console.log(snapshot.val().destination)
  console.log(snapshot.val().firstArrival)
  console.log(snapshot.val().frequency)
  // Change the HTML to reflect
  $('#train-name').text(snapshot.val().trainName)
  $('#train-destination').text(snapshot.val().destination)
  $('#train-first-arrival').text(snapshot.val().firstArrival)
  $('#train-frequency').text(snapshot.val().frequency)

  // Handle the errors
}, function (errorObject) {
  console.log(`Errors handled: ${errorObject.code}`)
})

console.log(dataRef)
