import '../styles/globals.css'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        })
      })
    }
  }, [])

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  )
}
