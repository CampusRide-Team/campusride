import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
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
import DriverHome         from './src/screens/driver/DriverHome'
import ActiveRequests     from './src/screens/driver/ActiveRequests'
import DriverNavigation   from './src/screens/driver/DriverNavigation'
import TripSummary        from './src/screens/driver/TripSummary' 
import DriverProfile      from './src/screens/driver/DriverProfile' 
import RideHistory        from './src/screens/driver/RideHistory'
import DriverNotis        from './src/screens/driver/DriverNotis'
import DriverSupport      from './src/screens/driver/DriverSupport' 
import EditDriverProfile  from './src/screens/driver/EditDriverProfile'
import DriverSettings     from './src/screens/driver/DriverSettings'

const RootNavigator = () => {
  const [screen, setScreen] = useState('splash')
  const { role, setRole, logout } = useAuth()
  const [tempVehicleData, setTempVehicleData] = useState(null)

  // Global persistence states to remember the selection across screens
  const [selectedRequestId, setSelectedRequestId] = useState('req_lucy')
  const [activeTripData, setActiveTripData] = useState(null)

  // Real-Time Trip Performance Tracking States
  const [tripStartTime, setTripStartTime] = useState(null)
  const [finalCalculatedTrip, setFinalCalculatedTrip] = useState(null)

  // LOCAL STATE DRIVER LEDGER: Holds live edits seamlessly across views without database lag
  const [driverProfileData, setDriverProfileData] = useState({
    fullName: 'Alex Johnson',
    email: 'alex.j@gmail.com',
    avatarUri: null,
  })

  // THE REQUESTS POOL STATE (Starts with 3 active requests)
  const [requestsPool, setRequestsPool] = useState([
    {
      id: 'req_lucy',
      name: 'Lucy Amankwa',
      pickup: 'Law Department',
      destination: 'Engineering Block C',
      distance: '2.5 km',
      arrival: '3 mins',
      avatarEmoji: '👩‍🎓',
      rideMode: 'shared',
    },
    {
      id: 'req_kwame',
      name: 'Kwame Mensah',
      pickup: 'Balme Library',
      destination: 'Gym / Sports Stadium',
      distance: '1.2 km',
      arrival: '5 mins',
      avatarEmoji: '👨‍🎓',
      rideMode: 'private',
    },
    {
      id: 'req_aisha',
      name: 'Aisha Osei',
      pickup: 'Dorms A / Volta',
      destination: 'Bush Canteen Cafe',
      distance: '0.8 km',
      arrival: '2 mins',
      avatarEmoji: '👩‍💼',
      rideMode: 'shared',
    },
  ])

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
        driverData={driverProfileData} 
        onLogout={handleLogout} 
        onViewRequests={() => setScreen('active-requests')}
        onChangeTab={(targetTab) => {
          if (targetTab === 'trips') setScreen('active-requests')
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 12. Incoming Ride Requests Dashboard Queue Screen Layout
  if (screen === 'active-requests') {
    return (
      <ActiveRequests 
        onBack={() => setScreen('home')} 
        onAcceptRide={(acceptedPassenger) => {
          setActiveTripData(acceptedPassenger)
          setTripStartTime(Date.now()) 
          setScreen('driver-navigation')
        }}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'profile') setScreen('driver-profile')
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
          console.log('Driver confirmed destination drop-off completed.')

          const endTime = Date.now()
          const totalElapsedMs = endTime - tripStartTime
          const durationCalculated = tripStartTime ? Math.round(totalElapsedMs / 60000) : 12

          let durationTextValue = '12 minutes'
          let distanceTextValue = '4.2 km'

          if (durationCalculated > 0) {
            durationTextValue = `${durationCalculated} ${durationCalculated === 1 ? 'minute' : 'minutes'}`
            distanceTextValue = `${(durationCalculated * 0.35).toFixed(1)} km`
          }

          const dynamicTripPayload = {
            driverName: driverProfileData.fullName.split(' ')[0], 
            pickupLocation: activeTripData?.pickup || 'Engineering Block C',
            destinationLocation: activeTripData?.destination || 'Student Union North',
            durationText: durationTextValue,
            distanceText: distanceTextValue, 
          }

          setFinalCalculatedTrip(dynamicTripPayload)

          if (activeTripData) {
            setRequestsPool(currentPool => 
              currentPool.filter(request => request.id !== activeTripData.id)
            )
          }

          setScreen('trip-summary') 
        }}
        onCancelNoPenalty={() => {
          Alert.alert(
            "Trip Canceled",
            `No-show recorded for ${activeTripData?.name || 'Passenger'}. Your driver score is unaffected.`,
            [
              {
                text: "OK",
                onPress: () => {
                  if (activeTripData) {
                    setRequestsPool(currentPool => 
                      currentPool.filter(request => request.id !== activeTripData.id)
                    )
                  }
                  setActiveTripData(null)
                  setTripStartTime(null)
                  setScreen('active-requests')
                }
              }
            ],
            { cancelable: false }
          )
        }}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'active-requests') setScreen('active-requests')
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 14. Post-Trip Physical Cash Receipt Summary Interface
  if (screen === 'trip-summary') {
    return (
      <TripSummary
        tripData={finalCalculatedTrip} 
        onDismiss={() => {
          setActiveTripData(null)
          setFinalCalculatedTrip(null)
          setTripStartTime(null)
          setScreen('home')
        }}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'trips') setScreen('active-requests')
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 15. Driver Settings and Analytics Profile Workspace Screen Frame
  if (screen === 'driver-profile') {
    return (
      <DriverProfile
        driverData={driverProfileData} 
        onLogout={() => {
          logout()
          setScreen('role-selection')
        }}
        onNavigate={(targetTab) => {
          if (targetTab === 'home')            return setScreen('home')
          if (targetTab === 'active-requests')  return setScreen('active-requests')
          if (targetTab === 'profile')          return; 
          if (targetTab === 'ride-history')     return setScreen('ride-history')
          if (targetTab === 'notifications')    return setScreen('driver-notis')
          if (targetTab === 'help-support')     return setScreen('driver-support')
          if (targetTab === 'settings')         return setScreen('edit-driver-profile') 
          if (targetTab === 'app-settings')     return setScreen('app-settings') 
        }}
      />
    )
  }

  // 16. Ride History Archive Module
  if (screen === 'ride-history') {
    return (
      <RideHistory
        onBack={() => setScreen('driver-profile')}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'trips') setScreen('active-requests')
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 17. Standalone Driver Notifications Module
  if (screen === 'driver-notis') {
    return (
      <DriverNotis
        onBack={() => setScreen('driver-profile')}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'trips') setScreen('active-requests') 
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 18. Standalone Driver Help & Support Module
  if (screen === 'driver-support') {
    return (
      <DriverSupport
        onBack={() => setScreen('driver-profile')}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'trips') setScreen('active-requests') 
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 19. Standalone Driver Edit Profile Module
  if (screen === 'edit-driver-profile') {
    return (
      <EditDriverProfile
        onBack={() => setScreen('driver-profile')}
        onChangeTab={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'trips') setScreen('active-requests') 
          if (targetTab === 'profile') setScreen('driver-profile')
        }}
      />
    )
  }

  // 20. Standalone Driver App Settings Module
  if (screen === 'app-settings') {
    return (
      <DriverSettings
        onBack={() => setScreen('driver-profile')}
        onNavigate={(targetTab) => {
          if (targetTab === 'home') setScreen('home')
          if (targetTab === 'active-requests') setScreen('active-requests')
          if (targetTab === 'profile') setScreen('driver-profile')
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