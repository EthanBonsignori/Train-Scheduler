// Init audio selectors
const trainAudio = document.getElementById('audio')
const midnightTrain = document.getElementById('midnight-train')
let isUpdate = false

// Hide and show html elements based on whether user is logged in or out
const userLoggedOut = document.querySelectorAll('.logged-out')
const userLoggedIn = document.querySelectorAll('.logged-in')
const accountDetails = $('#account-details')
let userDisplayName

const setupUI = (user) => {
  // if logged in
  if (user) {
    accountDetails.empty()
    db.collection('users').doc(user.uid).get().then(doc => {
      userDisplayName = doc.data().displayName
      // Show account info
      const html = `
        <h6 id="display-name" data-value="${doc.data().displayName}">Display Name: ${doc.data().displayName}</h6>
        <h6>Email: ${user.email}</h6>
        <h6>Account created: ${user.metadata.creationTime}</h6>`
      accountDetails.prepend(html)
    })
    // Show UI elements
    userLoggedIn.forEach((item) => { item.style.display = 'block' })
    userLoggedOut.forEach((item) => { item.style.display = 'none' })
  // if logged out
  } else {
    // Hide account details
    accountDetails.empty()
    // Hide UI elements
    userLoggedIn.forEach((item) => { item.style.display = 'none' })
    userLoggedOut.forEach((item) => { item.style.display = 'block' })
  }
}

// Calculate next time the train will arrive and how many minutes away
let getTrainTime = (first, freq) => {
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

// Create new train
const trainForm = $('#input-card')
trainForm.on('submit', (e) => {
  e.preventDefault()
  // Get user input
  let trainName = $('#train-name').val().trim()
  let destination = $('#train-destination').val().trim()
  let firstArrival = $('#train-first-arrival').val().trim()
  let frequency = $('#train-frequency').val().trim()
  // Check the user input
  let inputValid = checkValidity(trainName, destination, firstArrival, frequency)
  // Only continue if the checkValidity function returns true
  if (inputValid) {
    // Get user display name
    let displayName = $('#display-name').attr('data-value')
    let currentUID = auth.currentUser.uid
    // Push input to firebase
    db.collection('trains').add({
      trainName: trainName,
      destination: destination,
      firstArrival: firstArrival,
      frequency: frequency,
      dateAdded: new Date(),
      createdBy: displayName,
      createdByID: currentUID
    }).then(() => {
      inputFormAnimate()
      // Reset form fields
      $('#train-form').find('input:text, textarea').val('')
      document.getElementById('train-first-arrival').value = moment().format('HH:mm')
    }).catch(error => {
      console.log(error.message)
    })
  } else {
    console.log(inputValid)
  }
})

// Holds train names so they cannot be re-used
let trainNames = []
let createTrains = (data) => {
  if (data.length) {
    let html = ''
    let inc = 0
    // reset the train name array
    trainNames = []
    data.forEach(doc => {
      const train = doc.data()
      let id = doc.id
      trainNames.push(train.trainName.toLowerCase())
      // Returns converted time values
      let times = getTrainTime(train.firstArrival, train.frequency)
      let minutesAway = times[0]
      let nextArrival = times[1]
      // Store markup in a variable so we can add to it before displaying
      let tr = `
        <tr data-id="${id}">
          <td>${train.trainName}</td>
          <td>${train.destination}</td>
          <td>${train.frequency}</td>
          <td>${nextArrival}</td>
          <td>${minutesAway}</td>
          <td id="appendEdit${inc}" data-value="${train.createdByID}">${train.createdBy}</td>`
      // Grab the current user uid
      let currentUID = auth.currentUser.uid
      // If the current user uid matches the ID of the person who created the train,
      if (train.createdByID === currentUID) {
        //  add an edit button to this trains table row (allows users to edit their train(s))
        tr += `
        <td>
          <span data-toggle="tooltip" data-placement="top" title="Edit">
            <button class="edit" data-id="${id}" data-toggle="modal" data-target="#edit-modal" data-backdrop="false">
              <i class="fas fa-edit"></i>
            </button>
          </span>
        </td>
      </tr>`
      } else {
        // end the table row (no edit button)
        tr += `</tr>`
      }
      // Add all the html markup to a variable
      html += tr
    })
    // Set the html of train table to dynamically created train data from firestore
    $('#train-table').html(html)
    // Get tooltips & Hide them when they aren't hovered (so they don't remain open on modal popup)
    $('[data-toggle="tooltip"]').tooltip({ trigger: 'hover' })
  }
}

// Listen for clicks on any edit button
$(document).on('click', '.edit', function () {
  // Get the id of the clicked button
  let editID = $(this).attr('data-id')
  // Find the element clicked on in probably the ugliest way possible
  let namePlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(0).text()
  let destPlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(1).text()
  let freqPlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(2).text()
  // Set the edit input placeholder text so it matches the element the user wants to edit
  $('#new-train-name').val(namePlaceHolder)
  $('#new-train-dest').val(destPlaceHolder)
  $('#new-train-freq').val(freqPlaceHolder)
  // Listen for clicks on save
  $('#save-button').click((e) => {
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
      db.doc(`/trains/${editID}`).update({
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

// INPUT VALIDATION
// Only allows train to be added or edited if it meets necessary requirements
let checkValidity = (name, dest, first, freq, isUpdate) => {
  console.log('checking vailidty of input')
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
  if (dest === '' || dest.length < 2) {
    destErr.text(' Destination is required. (2-20 Characters) ')
    destErr.addClass('active')
    err++
  } else {
    destErr.text('')
    destErr.removeClass('active')
  }
  // Play midnight train if destination includes ga or georgia
  // update the subtitle so it reads 'Midnight Train to Georgia'
  let lcDest = dest.toLowerCase()
  if (lcDest.includes('ga') || lcDest.includes('georgia')) {
    $('#subtitle').text('to Georgia').addClass('animated')
    $('#moon').addClass('animated')
    $('#title-icon').addClass('animated')
    $('#audio-toggle').addClass('animated')
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
    console.log(`Input invalid - Errors: ${err}`)
    return false
  } else {
    console.log('Input valid - Sending train.')
    return true
  }
}

// OLD FIREBASE REALTIME DATABASE UPDATER
// // Listens for edits and displays them to every instance of the page that's open
// db.collection('trains').on('child_changed', function (snapshot) {
//   let editID = snapshot.key

//   $('#train-table > tr').each(function () {
//     let trID = $(this).data('id')
//     if (trID === editID) {
//       console.log(snapshot.val().trainName)
//       $(this).children('td').eq(0).text(snapshot.val().trainName)
//       $(this).children('td').eq(1).text(snapshot.val().destination)
//       $(this).children('td').eq(2).text(snapshot.val().frequency)
//     }
//   })
// })

// Allows user to dismiss errors by clicking on them
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
  $('.send-animate').removeClass('animated')
  $('.send-animate').addClass('is-sent')
  setTimeout(function () {
    $('.send-animate').removeClass('is-sent')
  }, 1800)
}

// Initialize audio
// Set audio volume very low (background noise)
trainAudio.volume = 0.08
// Play the train noise when/if Midnight train ends
midnightTrain.addEventListener('ended', function () {
  $('#subtitle').text('to wherever').removeClass('animated')
  $('#moon').removeClass('animated')
  $('#title-icon').removeClass('animated')
  $('#audio-toggle').removeClass('animated')
  trainAudio.play()
})

// Add some placeholder to the first arrival input
document.getElementById('train-first-arrival').value = moment().format('HH:mm')

// Grab Tooltips
$('[data-toggle="tooltip"]').tooltip()
