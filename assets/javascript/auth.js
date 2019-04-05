// Hide and show html elements based on whether user is logged in or out
const userLoggedOut = document.querySelectorAll('.logged-out')
const userLoggedIn = document.querySelectorAll('.logged-in')

const setupUI = (user) => {
  if (user) {
    userLoggedIn.forEach(item => item.style.display = 'block')
    userLoggedOut.forEach(item => item.style.display = 'none')
  } else {
    userLoggedIn.forEach(item => item.style.display = 'none')
    userLoggedOut.forEach(item => item.style.display = 'block')
  }
}

// Listen for auth status changes
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in', user)
    // Grab train info on any change in the database
    db.collection('trains').onSnapshot(snapshot => {
      createTrains(snapshot.docs)
      setupUI(user)
    })
  } else {
    console.log('User logged out')
    // Run function without data if user is not logged in
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
  let passwordGood = true
  auth.createUserWithEmailAndPassword(email, password)
    .catch(function (error) {
      passwordGood = false
      $('#password-response').html(error.message).css('color', 'red')
    }).then(function (cred) {
      if (passwordGood) {
        // Close the signup modal and clear the signup forms
        console.log(cred.user)
        $('#modal-signup').modal('toggle')
        document.getElementById('signup-form').reset()
        let user = auth.currentUser
        user.updateProfile({
          displayName: displayName
        })
      }
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
  // Sign the user out
  auth.signOut()
})
