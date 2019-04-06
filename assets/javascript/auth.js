// Hide and show html elements based on whether user is logged in or out
const userLoggedOut = document.querySelectorAll('.logged-out')
const userLoggedIn = document.querySelectorAll('.logged-in')
const accountDetails = $('#account-details')

const setupUI = (user) => {
  // if logged in
  if (user) {
    accountDetails.empty()
    // Show account info
    const html = `
      <h6 id="display-name">Display Name: ${user.displayName}</h6>
      <h6>Email: ${user.email}</h6>
      <h6>Account created: ${user.metadata.creationTime}</h6>
    `
    accountDetails.prepend(html)
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

// Store user displayname of logged in user globally
let userDisplayName
// Listen for auth status changes
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in', user)
    // Save the display name of the logged in user
    userDisplayName = user.displayName
    // Grab train info on any change in the database
    db.collection('trains').onSnapshot(snapshot => {
      createTrains(snapshot.docs)
      setupUI(user)
    }, error => console.log(error.message))
  } else {
    console.log('User logged out')
    // Run functions without data if user is not logged in so they won't display anything
    setupUI()
    createTrains([])
  }
})

// New user signup
const signupForm = $('#signup-form')
signupForm.on('submit', (e) => {
  e.preventDefault()

  // Get Signup Form Inputs
  const displayName = $('#signup-displayname').val()
  const email = $('#signup-email').val()
  const password = $('#signup-password').val()

  // Signup the user
  auth.createUserWithEmailAndPassword(email, password)
    .then(function (cred) {
      // Close the signup modal and clear the signup forms
      $('#modal-signup').modal('toggle')
      document.getElementById('signup-form').reset()
      let user = auth.currentUser
      user.updateProfile({
        displayName: displayName,
      })
    }).catch(function (error) {
      $('#password-response').html(error.message).css('color', 'red')
    })
})

// Toggle password visibility with icon by switching it from type=password to type=text
$('.password-toggle').on('click', function () {
  $(this).children('i').toggleClass('fa-eye fa-eye-slash')
  let pwInput = $('.password')
  let type = pwInput.attr('type')
  if (type === 'password') {
    pwInput.attr('type', 'text')
  } else {
    pwInput.attr('type', 'password')
  }
})

// Get user keyup from password field to check if both password fields match
$('#signup-password, #signup-password-confirm').on('keyup', function () {
  let pw1 = $('#signup-password')
  let pw2 = $('#signup-password-confirm')
  let pwResponse = $('#password-response')
  if (pw1.val() === pw2.val()) {
    pwResponse.html('Password match').css('color', 'green')
    $('#match').css('display', 'block')
    $('#no-match').css('display', 'none')
  } else {
    pwResponse.html('Passwords do not match').css('color', 'red')
    $('#no-match').css('display', 'block')
    $('#match').css('display', 'none')
  }
})

// User Login
const loginForm = $('#login-form')
loginForm.on('submit', (e) => {
  e.preventDefault()

  // Get user info
  const email = $('#login-email').val()
  const password = $('#login-password').val()

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      // Close the login modal and clear the login forms
      $('#modal-login').modal('toggle')
      document.getElementById('login-form').reset()
    }).catch(function (error) {
      $('#password-login-response').html(error.message).css('color', 'red')
    })
})

// User logout
const logout = $('#logout')
logout.on('click', (e) => {
  e.preventDefault()
  console.log('click logout')
  // Sign the user out
  auth.signOut()
})
