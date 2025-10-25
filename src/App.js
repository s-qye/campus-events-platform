import React, { useState } from 'react';
import { Calendar, Filter, Upload, Clock, MapPin, Users, TrendingUp, Flag, X, CheckCircle, AlertCircle, LogIn, Trash2, Shield, FileImage } from 'lucide-react';

const categories = ['Cultural', 'Professional', 'Academic', 'Social', 'Sports', 'Service', 'Arts'];
const verificationTypes = ['Official', 'Student Posted', 'Community'];
const eligibilityOptions = ['All Students', 'Freshmen', 'Sophomores', 'Juniors', 'Seniors', 'Grad Students', 'Specific Majors'];

const EventDiscoveryPlatform = () => {
  const [view, setView] = useState('calendar');
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'International Food Festival',
      date: '2025-10-28',
      time: '18:00',
      location: 'Student Union',
      category: 'Cultural',
      verification: 'Official',
      eligibility: 'All Students',
      description: 'Celebrate diverse cultures through food from around the world',
      flags: 0,
      createdBy: 'admin',
      accountType: 'club',
      flyerUrl: null
    },
    {
      id: 2,
      title: 'Tech Career Fair',
      date: '2025-10-30',
      time: '14:00',
      location: 'Career Center',
      category: 'Professional',
      verification: 'Official',
      eligibility: 'All Students',
      description: 'Meet recruiters from top tech companies',
      flags: 0,
      createdBy: 'admin',
      accountType: 'club',
      flyerUrl: null
    },
    {
      id: 3,
      title: 'Open Mic Night',
      date: '2025-10-26',
      time: '20:00',
      location: 'Coffee House',
      category: 'Arts',
      verification: 'Student Posted',
      eligibility: 'All Students',
      description: 'Showcase your talent - music, poetry, comedy welcome',
      flags: 0,
      createdBy: 'student1',
      accountType: 'user',
      flyerUrl: null
    }
  ]);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [accountType, setAccountType] = useState('user');
  
  const [users, setUsers] = useState([
    { username: 'admin', password: 'admin123', email: 'admin@example.com', type: 'club', clubName: 'Student Activities', verified: true },
    { username: 'student1', password: 'student123', email: 'student1@example.com', type: 'user', verified: false }
  ]);
  
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    email: '',
    clubName: ''
  });
  
  const [filters, setFilters] = useState({
    categories: [],
    verification: [],
    eligibility: []
  });
  
  const [showUpload, setShowUpload] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('manual');
  const [scanning, setScanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageData, setUploadedImageData] = useState(null);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Cultural',
    verification: 'Student Posted',
    eligibility: 'All Students',
    description: ''
  });

  const handleLogin = () => {
    const user = users.find(u => 
      u.username === authForm.username && 
      u.password === authForm.password
    );
    
    if (user) {
      setCurrentUser(user);
      setShowAuth(false);
      setAuthForm({ username: '', password: '', email: '', clubName: '' });
      alert(`Welcome back, ${user.username}!`);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleSignup = () => {
    if (!authForm.username || !authForm.password || !authForm.email) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (accountType === 'club' && !authForm.clubName) {
      alert('Please enter your club name');
      return;
    }
    
    if (users.find(u => u.username === authForm.username)) {
      alert('Username already exists');
      return;
    }
    
    const newUser = {
      username: authForm.username,
      password: authForm.password,
      email: authForm.email,
      type: accountType,
      clubName: accountType === 'club' ? authForm.clubName : null,
      verified: false
    };
    
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setShowAuth(false);
    setAuthForm({ username: '', password: '', email: '', clubName: '' });
    alert(`Account created successfully! Welcome, ${newUser.username}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    alert('Logged out successfully');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!currentUser) {
      alert('Please log in to upload events');
      return;
    }
    
    setScanning(true);
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadedImageData(`data:${file.type};base64,${base64}`);
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: file.type,
                  data: base64
                }
              },
              {
                type: 'text',
                text: `Analyze this image and determine if it appears to be an event flyer or poster.

If this is NOT an event flyer/poster, respond with ONLY: {"error": "not_event"}

If it IS an event flyer, extract the event information and return ONLY a JSON object with this exact format:
{
  "title": "event name from the flyer",
  "date": "YYYY-MM-DD format",
  "time": "HH:MM in 24-hour format",
  "location": "venue or location",
  "description": "brief description of the event",
  "category": "one of: Cultural, Professional, Academic, Social, Sports, Service, Arts"
}

Important:
- If you cannot read the image clearly, respond with: {"error": "unreadable"}
- If any specific field cannot be determined, use "TBD" for that field
- Make your best estimate for the category based on the event type
- Do not include any explanation, only return the JSON object`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === 'text')?.text || '';
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      let extracted;
      try {
        extracted = JSON.parse(cleanText);
      } catch (e) {
        throw new Error('Failed to parse API response');
      }
      
      if (extracted.error === 'not_event') {
        alert('Error: This image does not appear to be an event flyer. Please upload a valid event poster.');
        setUploadedImage(null);
        setUploadedImageData(null);
        setScanning(false);
        return;
      }
      
      if (extracted.error === 'unreadable') {
        alert('Error: The uploaded image cannot be read clearly. Please upload a clearer image or enter the details manually.');
        setUploadedImage(null);
        setUploadedImageData(null);
        setScanning(false);
        return;
      }
      
      setNewEvent({
        ...newEvent,
        title: extracted.title || '',
        date: extracted.date || '',
        time: extracted.time || '',
        location: extracted.location || '',
        description: extracted.description || '',
        category: extracted.category || 'Cultural',
        verification: currentUser.type === 'club' && currentUser.verified ? 'Official' : 'Student Posted',
        eligibility: 'All Students'
      });
      
      setUploadMethod('manual');
      alert('Flyer scanned successfully! Please review the auto-filled details below.');
    } catch (error) {
      console.error('Scan error:', error);
      alert('Error: Failed to scan flyer. The image may be unclear or not contain readable text. Please try manual entry.');
      setUploadedImage(null);
      setUploadedImageData(null);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitEvent = () => {
    if (!currentUser) {
      alert('Please log in to create events');
      return;
    }
    
    if (!newEvent.title || !newEvent.date) {
      alert('Title and date are required');
      return;
    }
    
    const event = {
      ...newEvent,
      id: Date.now(),
      flags: 0,
      createdBy: currentUser.username,
      accountType: currentUser.type,
      flyerUrl: uploadedImageData
    };
    
    setEvents([...events, event]);
    
    setNewEvent({
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'Cultural',
      verification: 'Student Posted',
      eligibility: 'All Students',
      description: ''
    });
    setUploadedImage(null);
    setUploadedImageData(null);
    setShowUpload(false);
    
    alert('Event created successfully!');
  };

  const handleDeleteEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (!currentUser || event.createdBy !== currentUser.username) {
      alert('You can only delete events you created');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== eventId));
      setSelectedEvent(null);
    }
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const filteredEvents = events.filter(event => {
    if (filters.categories.length && !filters.categories.includes(event.category)) return false;
    if (filters.verification.length && !filters.verification.includes(event.verification)) return false;
    if (filters.eligibility.length && !filters.eligibility.includes(event.eligibility)) return false;
    return true;
  });

  const getEventsByDate = () => {
    const grouped = {};
    filteredEvents.forEach(event => {
      if (!grouped[event.date]) grouped[event.date] = [];
      grouped[event.date].push(event);
    });
    return grouped;
  };

  const getVerificationIcon = (type) => {
    if (type === 'Official') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (type === 'Community') return <Users className="w-4 h-4 text-blue-600" />;
    return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      Cultural: 'bg-purple-100 text-purple-700',
      Professional: 'bg-blue-100 text-blue-700',
      Academic: 'bg-green-100 text-green-700',
      Social: 'bg-pink-100 text-pink-700',
      Sports: 'bg-orange-100 text-orange-700',
      Service: 'bg-teal-100 text-teal-700',
      Arts: 'bg-indigo-100 text-indigo-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getPopularTimes = () => {
    const hours = {};
    events.forEach(event => {
      if (event.time) {
        const hour = parseInt(event.time.split(':')[0]);
        hours[hour] = (hours[hour] || 0) + 1;
      }
    });
    const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return sorted.map(([hour]) => {
      const h = parseInt(hour);
      return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Campus Events</h1>
              <p className="text-sm text-slate-600">Discover events happening around campus</p>
            </div>
            <div className="flex gap-2 items-center">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{currentUser.username}</span>
                    {currentUser.verified && <Shield className="w-4 h-4 text-green-600" title="Verified Account" />}
                    <span className="text-xs text-slate-500">({currentUser.type})</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login / Sign Up
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              {currentUser && (
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add Event
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('trending')}
              className={`px-4 py-2 rounded-lg transition-colors ${view === 'trending' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Insights
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {showFilters && (
            <div className="w-64 bg-white rounded-lg shadow-sm p-4 h-fit">
              <h3 className="font-semibold mb-3">Filters</h3>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Categories</p>
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => toggleFilter('categories', cat)}
                      className="rounded"
                    />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Verification</p>
                {verificationTypes.map(type => (
                  <label key={type} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={filters.verification.includes(type)}
                      onChange={() => toggleFilter('verification', type)}
                      className="rounded"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setFilters({ categories: [], verification: [], eligibility: [] })}
                className="w-full px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="flex-1">
            {view === 'calendar' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
                <div className="space-y-6">
                  {Object.entries(getEventsByDate()).sort().map(([date, dateEvents]) => (
                    <div key={date}>
                      <h3 className="font-medium text-slate-700 mb-2">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="space-y-2">
                        {dateEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {getVerificationIcon(event.verification)}
                                  <h4 className="font-semibold">{event.title}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(event.category)}`}>
                                    {event.category}
                                  </span>
                                  {event.flyerUrl && <FileImage className="w-4 h-4 text-slate-400" title="Has flyer" />}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {event.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    by {event.createdBy}
                                  </span>
                                </div>
                              </div>
                              {currentUser && event.createdBy === currentUser.username && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event.id);
                                  }}
                                  className="ml-2 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'list' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">All Events</h2>
                <div className="space-y-2">
                  {filteredEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getVerificationIcon(event.verification)}
                            <h4 className="font-semibold">{event.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(event.category)}`}>
                              {event.category}
                            </span>
                            {event.flyerUrl && <FileImage className="w-4 h-4 text-slate-400" title="Has flyer" />}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                            <span>{new Date(event.date + 'T00:00:00').toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                            <span className="text-xs text-slate-500">
                              by {event.createdBy}
                            </span>
                          </div>
                        </div>
                        {currentUser && event.createdBy === currentUser.username && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="ml-2 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'trending' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Event Insights
                  </h2>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <p className="text-2xl font-bold text-indigo-600">{events.length}</p>
                      <p className="text-sm text-slate-600">Total Events</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {events.filter(e => e.verification === 'Official').length}
                      </p>
                      <p className="text-sm text-slate-600">Official Events</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.type === 'club').length}</p>
                      <p className="text-sm text-slate-600">Clubs</p>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-3">Popular Event Times</h3>
                  <div className="space-y-2">
                    {getPopularTimes().length > 0 ? getPopularTimes().map((time, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <span className="text-slate-700">{time}</span>
                      </div>
                    )) : <p className="text-sm text-slate-500">No time data available yet</p>}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold mb-3">Category Distribution</h3>
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const count = events.filter(e => e.category === cat).length;
                      const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{cat}</span>
                            <span>{count} events</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
              <button onClick={() => {
                setShowAuth(false);
                setAuthForm({ username: '', password: '', email: '', clubName: '' });
              }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Account Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="user"
                        checked={accountType === 'user'}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="rounded"
                      />
                      <span className="text-sm">Student</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="club"
                        checked={accountType === 'club'}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="rounded"
                      />
                      <span className="text-sm">Club</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter username"
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter email"
                  />
                </div>
              )}

              {authMode === 'signup' && accountType === 'club' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Club Name *</label>
                  <input
                    type="text"
                    value={authForm.clubName}
                    onChange={(e) => setAuthForm({ ...authForm, clubName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter club name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter password"
                />
              </div>

              <button
                onClick={authMode === 'login' ? handleLogin : handleSignup}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthForm({ username: '', password: '', email: '', clubName: '' });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Event</h2>
              <button onClick={() => {
                setShowUpload(false);
                setUploadedImage(null);
                setUploadedImageData(null);
                setNewEvent({
                  title: '',
                  date: '',
                  time: '',
                  location: '',
                  category: 'Cultural',
                  verification: 'Student Posted',
                  eligibility: 'All Students',
                  description: ''
                });
              }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMethod('manual')}
                className={`flex-1 py-2 rounded-lg transition-colors ${uploadMethod === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setUploadMethod('scan')}
                className={`flex-1 py-2 rounded-lg transition-colors ${uploadMethod === 'scan' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
              >
                Scan Flyer
              </button>
            </div>

            {uploadMethod === 'scan' && (
              <div className="mb-4 p-6 border-2 border-dashed rounded-lg text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="flyer-upload"
                  disabled={scanning}
                />
                <label htmlFor="flyer-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    {scanning ? 'Scanning flyer...' : 'Click to upload a flyer image'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">AI will automatically extract event details</p>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {uploadedImage && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Uploaded Flyer</h3>
                  <img src={uploadedImage} alt="Flyer preview" className="w-full rounded-lg" />
                </div>
              )}

              <div className={uploadedImage ? '' : 'md:col-span-2'}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Title *</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Event name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date *</label>
                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Venue or building"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Eligibility</label>
                      <select
                        value={newEvent.eligibility}
                        onChange={(e) => setNewEvent({ ...newEvent, eligibility: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {eligibilityOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      placeholder="Brief description of the event"
                    />
                  </div>

                  <button
                    onClick={handleSubmitEvent}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Submit Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {getVerificationIcon(selectedEvent.verification)}
                <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              </div>
              <button onClick={() => setSelectedEvent(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full ${getCategoryColor(selectedEvent.category)}`}>
                  {selectedEvent.category}
                </span>
                <span className="text-sm text-slate-600">{selectedEvent.verification}</span>
              </div>

              <p className="text-slate-700">{selectedEvent.description}</p>

              {selectedEvent.flyerUrl && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Event Flyer</h3>
                  <img src={selectedEvent.flyerUrl} alt="Event flyer" className="w-full rounded-lg" />
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  {selectedEvent.time}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  {selectedEvent.location}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4" />
                  {selectedEvent.eligibility}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Posted by {selectedEvent.createdBy} ({selectedEvent.accountType})
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setEvents(events.map(e => 
                      e.id === selectedEvent.id ? { ...e, flags: e.flags + 1 } : e
                    ));
                    alert('Event reported. Thank you for your feedback.');
                    setSelectedEvent(null);
                  }}
                  className="flex-1 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  Add to Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDiscoveryPlatform;