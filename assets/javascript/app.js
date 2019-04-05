// Init audio selectors
const trainAudio = document.getElementById('audio')
const midnightTrain = document.getElementById('midnight-train')
let isUpdate = false

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
let db = firebase.database()
console.log(db.ref('bootcamp-2019/'))

$(document).on('click', '#submit', function (event) {
  event.preventDefault()

  // Get user input
  let trainName = $('#train-name').val().trim()
  let destination = $('#train-destination').val().trim()
  let firstArrival = $('#train-first-arrival').val().trim()
  let frequency = $('#train-frequency').val().trim()
  // Check the user input
  let inputValid = checkValidity(trainName, destination, firstArrival, frequency)
  // Only continue if the checkValidity() function returns true
  if (inputValid) {
    // Push input to firebase
    db.ref().push({
      trainName: trainName,
      destination: destination,
      firstArrival: firstArrival,
      frequency: frequency,
      dateAdded: firebase.database.ServerValue.TIMESTAMP
    })
    inputFormAnimate()
    // Reset form fields
    $('#train-form').find('input:text, textarea').val('')
    document.getElementById('train-first-arrival').value = moment().format('HH:mm')
  }
})

// Holds train names so they cannot be re-used
let trainNames = []
// Firebase watcher for new child
db.ref().on('child_added', function (snapshot) {
  trainNames.push(snapshot.val().trainName.toLowerCase())
  console.log('---- Used Train Names ----')
  console.log(trainNames)
  createTrains(snapshot)
  // On error,
}, function (errorObject) {
  console.log(`Errors on child_added: ${errorObject.code}`)
})

let createTrains = (snap) => {
  let first = snap.val().firstArrival
  let freq = snap.val().frequency
  let id = snap.key
  // Returns converted time values
  let times = getTrainTime(first, freq)
  let minutesAway = times[0]
  let nextArrival = times[1]
  // Add train to train schedule table
  let newRow = $('<tr>')
  newRow.attr('data-id', id)
  newRow.append(`<td>${snap.val().trainName}</td>`)
  newRow.append(`<td>${snap.val().destination}</td>`)
  newRow.append(`<td>${snap.val().frequency}</td>`)
  newRow.append(`<td>${nextArrival}</td>`)
  newRow.append(`<td>${minutesAway}</td>`)
  newRow.append(`<td> 
                  <button class="edit" data-id="${id}" data-toggle="modal" data-target="#edit-modal" data-backdrop="false">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>`)
  $('#train-table').append(newRow)
}

$(document).on('click', '.edit', function () {
  // Get the id of the clicked button
  let editID = $(this).attr('data-id')
  // Find the element clicked on in probably the ugliest way possible
  let namePlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(0).text()
  let destPlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(1).text()
  let freqPlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(2).text()
  // Set the edit input placeholder text to the element clicked on
  $('#new-train-name').val(namePlaceHolder)
  $('#new-train-dest').val(destPlaceHolder)
  $('#new-train-freq').val(freqPlaceHolder)
  // Listen for clicks on save
  $('#save-button').click(function (e) {
    e.preventDefault()
    isUpdate = true
    // Get text from inputs
    let trainName = $('#new-train-name').val()
    let destination = $('#new-train-dest').val()
    let frequency = $('#new-train-freq').val()
    // Check new inputs to make sure they are valid
    let updateValid = checkValidity(trainName, destination, null, frequency, isUpdate)
    // Update database with new values if they are valid
    if (updateValid) {
      db.ref(editID).update({
        trainName: trainName,
        destination: destination,
        frequency: frequency
      })
      $('#edit-modal').modal('toggle')
    }
  })
  $('#exit-button').click(function (e) {
    e.preventDefault()
    isUpdate = false
  })
})

// Listens for edits and displays them to every instance of the page that's open
db.ref().on('child_changed', function (snapshot) {
  let editID = snapshot.key

  $('#train-table > tr').each(function () {
    let trID = $(this).data('id')
    if (trID === editID) {
      console.log(snapshot.val().trainName)
      $(this).children('td').eq(0).text(snapshot.val().trainName)
      $(this).children('td').eq(1).text(snapshot.val().destination)
      $(this).children('td').eq(2).text(snapshot.val().frequency)
    }
  })
})

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
let checkValidity = (name, dest, first, freq, isUpdate) => {
  // Check if running validity check on update or add new train
  let nameErr, destErr, timeErr, freqErr
  if (isUpdate) {
    nameErr = $('#name-error-update')
    destErr = $('#dest-error-update')
    freqErr = $('#freq-error-update')
  } else {
    // Select the error html elements for each input field
    nameErr = $('#name-error')
    destErr = $('#dest-error')
    timeErr = $('#time-error')
    freqErr = $('#freq-error')
  }
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
  if ( lcDest.includes(' ga') || lcDest.includes('georgia') ) {
    $('#subtitle').text('to Georgia')
    trainAudio.pause()
    midnightTrain.volume = 1
    midnightTrain.play()
  }
  // Only check this if adding new train and not updating a previous one
  if (!isUpdate) {
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
let inputFormAnimate = () => {
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
