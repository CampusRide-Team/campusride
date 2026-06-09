import React, { useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
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
import DriverHome       from './src/screens/driver/DriverHome'
import ActiveRequests   from './src/screens/driver/ActiveRequests'
import DriverNavigation from './src/screens/driver/DriverNavigation'

const RootNavigator = () => {
  const [screen, setScreen] = useState('splash')
  const { role, setRole, logout } = useAuth()
  const [tempVehicleData, setTempVehicleData] = useState(null)
  
  // Global persistence states to remember the selection across screens
  const [selectedRequestId, setSelectedRequestId] = useState('req_lucy')
  const [activeTripData, setActiveTripData] = useState(null)

  // 1. Splash Screen
  if (screen === 'splash') {
    return <SplashScreen onFinish={() => setScreen('onboarding')} />
  }

  // 2. Onboarding Screen
  if (screen === 'onboarding') {
    return <Onboarding onFinish={() => setScreen('role-selection')} />
  }

  // 3. Role Selection Screen
  if (screen === 'role-selection') {
    return (
      <RoleSelection
        onSelectStudent={() => setScreen('student-login')}
        onSelectDriver={()  => setScreen('driver-login')}
      />
    )
  }

  // 4. Student Login Screen
  if (screen === 'student-login') {
    return (
      <StudentLogin
        onStudentLogin={() => {
          if (setRole) setRole('student')
          setScreen('home')
        }}
        onCreateAccount={() => setScreen('signup')}
        onGoogleLogin={() => {
          if (setRole) setRole('student')
          setScreen('home')
        }}
        onBack={() => setScreen('role-selection')}
      />
    )
  }

  // 5. Driver Login Screen
  if (screen === 'driver-login') {
    return (
      <DriverLogin
        onDriverLogin={() => {
          if (setRole) setRole('driver')
          setScreen('home')
        }}
        onDriverRegister={() => setScreen('driver-reg-step1')}
        onSupport={()        => console.log('Support clicked')}
        onBack={()           => setScreen('role-selection')}
      />
    )
  }

  // 6. Driver Registration — Stage 1
  if (screen === 'driver-reg-step1') {
    return (
      <DriverRegisterStep1
        onNext={(personalData) => setScreen('driver-reg-step2')}
        onBack={()  => setScreen('driver-login')}
        onLogin={() => setScreen('driver-login')}
      />
    )
  }

  // 7. Driver Registration — Stage 2
  if (screen === 'driver-reg-step2') {
    return (
      <DriverRegisterStep2
        onNext={(vehicleData) => {
          setTempVehicleData(vehicleData)
          setScreen('driver-reg-step3')
        }}
        onBack={()  => setScreen('driver-reg-step1')}
        onLogin={() => setScreen('driver-login')}
      />
    )
  }

  // 8. Driver Registration — Stage 3
  if (screen === 'driver-reg-step3') {
    return (
      <DriverRegisterStep3
        onSubmit={async (finalStepData) => setScreen('driver-reg-success')}
        onBack={()   => setScreen('driver-reg-step2')}
        onLogin={()  => setScreen('driver-login')}
      />
    )
  }

  // 9. Driver Registration — Stage 4
  if (screen === 'driver-reg-success') {
    return <DriverRegisterSuccess onBackToLogin={() => setScreen('driver-login')} />
  }

  // 10. Shared Signup Screen
  if (screen === 'signup') {
    return (
      <SignupScreen
        onDone={() => {
          if (setRole) setRole('student')
          setScreen('home')
        }}
        onSignIn={() => setScreen('student-login')}
      />
    )
  }

  // 11. Core Portal Dashboard
  if (screen === 'home') {
    const handleLogout = () => {
      logout()
      setScreen('role-selection')
    }

    return (
      <DriverHome 
        onLogout={handleLogout} 
        onViewRequests={() => setScreen('active-requests')}
        onChangeTab={(targetTab) => {
          if (targetTab === 'trips') setScreen('active-requests')
        }}
      />
    )
  }

  // 12. Incoming Ride Requests Dashboard Queue Screen Layout
  if (screen === 'active-requests') {
    return (
      <ActiveRequests 
        selectedId={selectedRequestId}
        onSelectId={setSelectedRequestId}
        onBack={() => setScreen('home')} 
        onAcceptRide={(acceptedPassenger) => {
          setActiveTripData(acceptedPassenger)
          setScreen('driver-navigation')
        }}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
        }}
      />
    )
  }

  // 13. Active Navigation Tracking Overlay Stack View
  if (screen === 'driver-navigation') {
    return (
      <DriverNavigation
        passenger={activeTripData}
        onBack={() => setScreen('active-requests')}
        onArrive={() => {
          console.log('Driver confirmed arrival for:', activeTripData?.name)
          setScreen('home') 
        }}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'active-requests') setScreen('active-requests')
        }}
      />
    )
  }

  return null
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}