import React, { useState } from 'react'
import { AuthProvider, useAuth } from './src/context/AuthContext'

// Auth screens
import SplashScreen          from './src/screens/auth/SplashScreen'
import Onboarding            from './src/screens/auth/Onboarding'
import RoleSelection         from './src/screens/auth/RoleSelection'
import StudentLogin          from './src/screens/auth/StudentLogin'
import DriverLogin           from './src/screens/auth/DriverLogin'
import SignupScreen          from './src/screens/auth/SignupScreen'
import DriverRegisterStep1   from './src/screens/auth/DriverRegisterStep1'
import DriverRegisterStep2   from './src/screens/auth/DriverRegisterStep2'
import DriverRegisterStep3   from './src/screens/auth/DriverRegisterStep3'
import DriverRegisterSuccess from './src/screens/auth/DriverRegisterSuccess'

// Student screens
import StudentHome from './src/screens/student/StudentHome'

// Driver screens
import DriverHome from './src/screens/driver/DriverHome'

const RootNavigator = () => {
  const [screen, setScreen] = useState('splash')
  const { role, logout }    = useAuth()

  // 1. Splash
  if (screen === 'splash') {
    return (
      <SplashScreen
        onFinish={() => setScreen('onboarding')}
      />
    )
  }

  // 2. Onboarding
  if (screen === 'onboarding') {
    return (
      <Onboarding
        onFinish={() => setScreen('role-selection')}
      />
    )
  }

  // 3. Role Selection
  if (screen === 'role-selection') {
    return (
      <RoleSelection
        onSelectStudent={() => setScreen('student-login')}
        onSelectDriver={()  => setScreen('driver-login')}
      />
    )
  }

  // 4. Student Login
  if (screen === 'student-login') {
    return (
      <StudentLogin
        onStudentLogin={()  => setScreen('home')}
        onCreateAccount={() => setScreen('signup')}
        onGoogleLogin={()   => setScreen('home')}
        onBack={()          => setScreen('role-selection')}
      />
    )
  }

  // 5. Driver Login
  if (screen === 'driver-login') {
    return (
      <DriverLogin
        onDriverLogin={()    => setScreen('home')}
        onDriverRegister={() => setScreen('driver-reg-step1')}
        onSupport={()        => console.log('Support clicked')}
        onBack={()           => setScreen('role-selection')}
      />
    )
  }

  // 6. Driver Registration — Stage 1 (Personal Details)
  if (screen === 'driver-reg-step1') {
    return (
      <DriverRegisterStep1
        onNext={(personalData) => {
          // TODO: BACKEND INTEGRATION
          // Optional: You can make an API call here to check if the email/phone already exists 
          // before letting the driver move to step 2.
          // Example: await api.post('/auth/check-exists', { email: personalData.email })
          
          setScreen('driver-reg-step2')
        }}
        onBack={()  => setScreen('driver-login')}
        onLogin={() => setScreen('driver-login')}
      />
    )
  }

  // 7. Driver Registration — Stage 2 (Vehicle Info & Step 2 Docs)
  if (screen === 'driver-reg-step2') {
    return (
      <DriverRegisterStep2
        onNext={(vehicleAndDocData) => {
          // This receives: vehicleType, licensePlate, vehicleColor, seats, driversLicense, nationalId
          // We pass this data forward to step 3 so everything can be submitted together.
          setScreen('driver-reg-step3')
        }}
        onBack={()  => setScreen('driver-reg-step1')}
        onLogin={() => setScreen('driver-login')}
      />
    )
  }

  // 8. Driver Registration — Stage 3 (Final Document Uploads & Complete Submission)
  if (screen === 'driver-reg-step3') {
    return (
      <DriverRegisterStep3
        onSubmit={async (finalStepData) => {
          /* TODO: BACKEND INTEGRATION
            When backend is ready, this is where you collect ALL data from the registration flow 
            and send it to your server using multipart/form-data (since it includes files).

            Example implementation:
            try {
              const formData = new FormData()
              
              // Text Fields
              formData.append('ghanaCardNumber', finalStepData.nationalIdNumber)
              
              // Image/Document Files
              formData.append('insuranceDoc', { uri: finalStepData.insuranceFile, name: 'insurance.pdf', type: 'application/pdf' })
              formData.append('licenseDoc', { uri: finalStepData.licenseFile, name: 'license.pdf', type: 'application/pdf' })
              formData.append('registrationDoc', { uri: finalStepData.registrationFile, name: 'registration.pdf', type: 'application/pdf' })
              formData.append('ghanaCardFront', { uri: finalStepData.ghanaCardFront, name: 'front.jpg', type: 'image/jpeg' })
              formData.append('ghanaCardBack', { uri: finalStepData.ghanaCardBack, name: 'back.jpg', type: 'image/jpeg' })

              const res = await api.post('/drivers/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })

              if (res.status === 201) {
                setScreen('driver-reg-success')
              }
            } catch (err) {
              console.error("Registration submission failed:", err)
            }
          */

          // Temporary mock transition until the pipeline above is live:
          setScreen('driver-reg-success')
        }}
        onBack={()   => setScreen('driver-reg-step2')}
        onLogin={()  => setScreen('driver-login')}
      />
    )
  }

  // 9. Driver Registration — Stage 4 (Verification Pending Status)
  if (screen === 'driver-reg-success') {
    return (
      <DriverRegisterSuccess
        onBackToLogin={() => setScreen('driver-login')}
      />
    )
  }

  // 10. Signup (Shared / Guest track)
  if (screen === 'signup') {
    return (
      <SignupScreen
        onDone={()   => setScreen('home')}
        onSignIn={() => setScreen('student-login')}
      />
    )
  }

  // 11. Home — role-based routing
  if (screen === 'home') {
    const handleLogout = () => {
      logout()
      setScreen('role-selection')
    }

    if (role === 'driver') {
      return <DriverHome onLogout={handleLogout} />
    }

    return <StudentHome onLogout={handleLogout} />
  }

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}