import React, { useState } from 'react';
import { Calendar, Filter, Upload, Clock, MapPin, Users, TrendingUp, Flag, X, CheckCircle, AlertCircle } from 'lucide-react';

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
      flags: 0
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
      flags: 0
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
      flags: 0
    }
  ]);
  
  const [filters, setFilters] = useState({
    categories: [],
    verification: [],
    eligibility: [],
    dateRange: 'all'
  });
  
  const [showUpload, setShowUpload] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('manual');
  const [scanning, setScanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanning(true);
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
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
                text: `Extract event information from this flyer. Return ONLY a JSON object with these fields:
{
  "title": "event name",
  "date": "YYYY-MM-DD format",
  "time": "HH:MM 24-hour format",
  "location": "venue",
  "description": "brief description",
  "category": "one of: Cultural, Professional, Academic, Social, Sports, Service, Arts"
}
If any field cannot be determined, use "TBD" for text fields or today's date for date.`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === 'text')?.text || '';
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const extracted = JSON.parse(cleanText);
      
      setNewEvent({
        ...newEvent,
        ...extracted,
        verification: 'Student Posted',
        eligibility: 'All Students'
      });
      
      setUploadMethod('manual');
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan flyer. Please try manual entry.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Title and date are required');
      return;
    }
    
    const event = {
      ...newEvent,
      id: Date.now(),
      flags: 0
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
    setShowUpload(false);
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Campus Events</h1>
              <p className="text-sm text-slate-600">Discover events happening around campus</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add Event
              </button>
            </div>
          </div>
          
          {/* View Toggle */}
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
          {/* Filters Sidebar */}
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
                onClick={() => setFilters({ categories: [], verification: [], eligibility: [], dateRange: 'all' })}
                className="w-full px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Main Content */}
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
                                <div className="flex items-center gap-2 mb-1">
                                  {getVerificationIcon(event.verification)}
                                  <h4 className="font-semibold">{event.title}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(event.category)}`}>
                                    {event.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {event.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                  </span>
                                </div>
                              </div>
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
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getVerificationIcon(event.verification)}
                            <h4 className="font-semibold">{event.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(event.category)}`}>
                              {event.category}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>{new Date(event.date + 'T00:00:00').toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          </div>
                        </div>
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
                      <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                      <p className="text-sm text-slate-600">Categories</p>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-3">Popular Event Times</h3>
                  <div className="space-y-2">
                    {getPopularTimes().map((time, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <span className="text-slate-700">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold mb-3">Category Distribution</h3>
                  <div className="space-y-2">
                    {categories.map(cat => {
                      const count = events.filter(e => e.category === cat).length;
                      const percentage = (count / events.length) * 100;
                      return (
                        <div key={cat}>
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
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setEvents(events.map(e => 
                      e.id === selectedEvent.id ? { ...e, flags: e.flags + 1 } : e
                    ));
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