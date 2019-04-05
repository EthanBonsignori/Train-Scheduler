// New user signup
const signupForm = $('#signup-form')
signupForm.on('submit', (e) => {
  e.preventDefault()

  // Get Signup Form Inputs
  const displayName = signupForm['signup-displayname'].val()
  const email = signupForm['signup-email'].val()
  const password = signupForm['singup-password'].val()

  // Signup the user
  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      console.log(cred)
    })
})
