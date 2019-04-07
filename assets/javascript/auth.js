// Listen for auth status changes
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in', user)
    // Grab train info on any change in the database
    db.collection('trains').orderBy('dateAdded', 'desc').onSnapshot(snapshot => {
      createTrains(snapshot.docs)
      setupUI(user)
    }, error => {
      console.log(error.message)
    })
  } else {
    $('.send-animate').addClass('animated')
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
  auth.createUserWithEmailAndPassword(email, password).then((cred) => {
    return db.collection('users').doc(cred.user.uid).set({
      displayName: displayName
    })
  }).then(() => {
    // Close the signup modal and clear the signup forms
    $('#modal-signup').modal('toggle')
    document.getElementById('signup-form').reset()
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
  // Sign the user out
  auth.signOut()
})
