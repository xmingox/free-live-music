'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface SubmitEventModalProps {
  isOpen: boolean
  onClose: () => void
}

const STATE_TO_METROS: Record<string, string[]> = {
  AL: ['Birmingham', 'Huntsville', 'Mobile', 'Montgomery'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Tempe'],
  AR: ['Little Rock', 'Fayetteville', 'Fort Smith'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach'],
  CO: ['Denver', 'Colorado Springs', 'Boulder', 'Fort Collins', 'Aurora'],
  CT: ['Hartford', 'New Haven', 'Bridgeport', 'Stamford'],
  DE: ['Wilmington', 'Dover', 'Newark'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Tallahassee'],
  GA: ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Athens'],
  HI: ['Honolulu', 'Hilo', 'Kailua'],
  ID: ['Boise', 'Nampa', 'Idaho Falls', 'Pocatello'],
  IL: ['Chicago', 'Aurora', 'Rockford', 'Naperville', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Bloomington'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Iowa City'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Covington'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'Augusta'],
  MD: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
  MI: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Flint'],
  MN: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'],
  MS: ['Jackson', 'Gulfport', 'Biloxi', 'Hattiesburg'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
  NV: ['Las Vegas', 'Reno', 'Henderson', 'North Las Vegas'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Portsmouth'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Trenton', 'Camden'],
  NM: ['Albuquerque', 'Santa Fe', 'Las Cruces', 'Rio Rancho'],
  NY: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Asheville'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
  OR: ['Portland', 'Eugene', 'Salem', 'Bend', 'Gresham'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Lancaster'],
  RI: ['Providence', 'Cranston', 'Warwick', 'Pawtucket'],
  SC: ['Columbia', 'Charleston', 'Greenville', 'Myrtle Beach'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
  TX: ['Houston', 'Dallas', 'San Antonio', 'Austin', 'Fort Worth', 'El Paso', 'Arlington'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'Ogden', 'St. George'],
  VT: ['Burlington', 'Essex', 'South Burlington', 'Montpelier'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington', 'Alexandria'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Olympia'],
  WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'],
}

const STATES = Object.keys(STATE_TO_METROS).sort()

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900'

export function SubmitEventModal({ isOpen, onClose }: SubmitEventModalProps) {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value)
    setCity('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email, city, state }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit event')
      }

      setStatus('success')
      setUrl('')
      setEmail('')
      setCity('')
      setState('')

      setTimeout(() => {
        onClose()
        setStatus('idle')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const metros = state ? STATE_TO_METROS[state] ?? [] : []

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Share a Free Live Event
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Help the community discover great music
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-6">
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Event submitted!</p>
                  <p className="text-sm text-green-800 mt-1">
                    Thanks for sharing. We'll review and post it soon.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-800 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {status !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Event URL *
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/summer-concerts"
                    required
                    className={INPUT_CLASS}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link to the event or venue page
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className={INPUT_CLASS}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    In case we have questions
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={handleStateChange}
                    required
                    className={INPUT_CLASS}
                  >
                    <option value="">Select a state</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    City/Metro Area *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    disabled={!state}
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      {state ? 'Select a city' : 'Select a state first'}
                    </option>
                    {metros.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="Other">Other (we're expanding)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Submitting...' : 'Share Event'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Free live music events only. We'll review and post within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
