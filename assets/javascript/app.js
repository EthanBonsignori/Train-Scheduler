// Init audio selectors
const trainAudio = document.getElementById('audio')
const midnightTrain = document.getElementById('midnight-train')
let isUpdate = false

// Hide and show html elements based on whether user is logged in or out
const userLoggedOut = document.querySelectorAll('.logged-out')
const userLoggedIn = document.querySelectorAll('.logged-in')
const setupUI = (user) => {
  // if logged in
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      // Show account info
      $('#display-name').attr('data-value', doc.data().displayName)
      $('#user-display-name').text(doc.data().displayName)
      $('#user-email').text(user.email)
      $('#user-account-created').text(user.metadata.creationTime)
    })
    // Show UI elements
    userLoggedIn.forEach((item) => { item.style.display = 'block' })
    userLoggedOut.forEach((item) => { item.style.display = 'none' })
  // if logged out
  } else {
    // Hide account details
    $('#display-name').attr('data-value', '')
    $('#user-display-name').text('')
    $('#user-email').text('')
    $('#user-account-created').text('')
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
  }
})

// Holds train names so they cannot be re-used
let trainNames = []
let createTrains = (data) => {
  if (data.length) {
    let html = ''
    // reset the train name array
    trainNames = []
    data.forEach(doc => {
      const train = doc.data()
      let id = doc.id
      trainNames.push(train.trainName.toLowerCase())
      console.log(trainNames)
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
          <td>${minutesAway}</td>`
      // Grab the current user uid
      let currentUID = auth.currentUser.uid
      // If the current user uid matches the ID of the person who created the train,
      if (train.createdByID === currentUID) {
        // Display "You" next to the user who created the train if it's the logged in user
        // Add an edit button to this train's table row which allows the user who created this train to edit some of its values
        tr += `
        <td>${train.createdBy} <span class="text-muted small">You</span></td>
        <td>
          <span data-toggle="tooltip" data-placement="top" title="Edit">
            <button class="edit" data-id="${id}" data-toggle="modal" data-target="#edit-modal" data-backdrop="false">
              <i class="fas fa-edit"></i>
            </button>
          </span>
        </td>
      </tr>`
      } else {
        // Add the user who created the train and end the table row (no edit button)
        tr += `
          <td>${train.createdBy}</td>
        </tr>`
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

//
// EDITS
//
// Store the firestore document ID of the selected train to edit globally so we can access it later
let editID, editIndex, namePlaceHolder
// Store html elements used in the functions to edit and delete trains
const confirmDelete = $('#confirm-delete')
const editForm = $('#edit-form-hide')
// Listen for clicks on any edit button
$(document).on('click', '.edit', function () {
  // Get the id of the clicked button
  editID = $(this).attr('data-id')
  // Find the element clicked on in probably the ugliest way possible
  namePlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(0).text()
  let destPlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(1).text()
  let freqPlaceHolder = $(`tr[data-id='${editID}']`).children('td').eq(2).text()
  // Set the edit input placeholder text so it matches the element the user wants to edit
  $('#new-train-name').val(namePlaceHolder)
  $('#new-train-dest').val(destPlaceHolder)
  $('#new-train-freq').val(freqPlaceHolder)
  // Grab the index of train being edited
  editIndex = trainNames.indexOf(namePlaceHolder.toLowerCase())
})
// SAVE EDIT
// When user clicks on the save button
$('#save-button').click((e) => {
  e.preventDefault()
  isUpdate = true
  // Get text from inputs
  let trainName = $('#new-train-name').val()
  let destination = $('#new-train-dest').val()
  let frequency = $('#new-train-freq').val()
  // Check validity of input
  let updateValid = false
  // If the trainName is equal to the one being edited,
  if (trainName.toLowerCase() === trainNames[editIndex]) {
    // Don't send the name to be checked
    updateValid = checkValidity(undefined, destination, null, frequency, isUpdate)
  // If the name is a new name,
  } else {
    // Check inputs regularly
    updateValid = checkValidity(trainName, destination, null, frequency, isUpdate)
  }
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
// EXIT EDIT
// When the user clicks on the exit button (closes modal from html data-toggle)
$('#exit-button').click((e) => {
  // Here all we need to do is prevent it from reloading the page
  e.preventDefault()
})
// DELETE TRAIN
// When user clicks on the delete button in the edit modal
$('#delete-button').click((e) => {
  e.preventDefault()
  // Hide the edit form and display the delete confirmation div
  editForm.css('display', 'none')
  confirmDelete.css('display', 'block')
})
// CONFIRM DELETE TRAIN
// When user clicks on the confirm delete button in the confirm delete div
$('#confirm-delete-button').click((e) => {
  e.preventDefault()
  db.collection('trains').doc(editID)
    .delete()
    .then(() => {
      console.log('Train successfully removed from existance!')
      // Close the modal and revert it back to the edit form instead of delete confirmation
      $('#edit-modal').modal('toggle')
      editForm.css('display', 'flex')
      confirmDelete.css('display', 'none')
    }).catch((error) => {
      console.error('Error removing train: ', error)
    })
})
// CANCEL DELETE TRAIN
// When user clicks on the cancel delete button in the confirm delete div
$('#cancel-delete-button').click((e) => {
  e.preventDefault()

  // Hide the delete confirmation div and display the edit form again
  editForm.css('display', 'flex')
  confirmDelete.css('display', 'none')
})

//
// INPUT VALIDATION
// abandon all hope he who enters here
// Only allows train to be added or edited if it meets necessary requirements
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
  // If there was a name param passed, check it, otherwise skip this block
  if (name) {
    if (trainNames.indexOf(name.toLowerCase()) > -1) {
      nameErr.text(' That train already exists! ')
      nameErr.addClass('active')
      err++
    } else if (name === '' || name.length < 3 || name.length > 20) {
      nameErr.text(' Train Name is required. (3-20 Characters) ')
      nameErr.addClass('active')
      err++
    } else {
      nameErr.text('')
      nameErr.removeClass('active')
    }
  }
  // Check Destination input
  if (dest === '' || dest.length < 2 || dest.length > 20) {
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
  // Only check this if adding new train and not updating a previous one because users can't change start time on edit
  if (!isUpdate) {
    // Check First Arrival input
    // regex for when browsers don't support <input type="time">
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
  // If no errors found in input return true, allowing functions to continue
  } else {
    console.log('Input Valid ---> Sending Train')
    return true
  }
}

// OLD FIREBASE REALTIME DATABASE UPDATER // NOW USING FIREBASE FIRESTORE CLOUD
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

// Animate submit train form on valid submission
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
