import React from 'react';

export default function InterviewsPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-6">Interview Settings</h2>
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Interview Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Interview Duration (minutes)</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>30</option>
                  <option>45</option>
                  <option>60</option>
                  <option>90</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Buffer Time Between Interviews (minutes)</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>5</option>
                  <option>10</option>
                  <option>15</option>
                  <option>20</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Interview Platform</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="platform-google" 
                  name="interview-platform" 
                  className="mr-2" 
                  defaultChecked
                />
                <label htmlFor="platform-google" className="mr-4">Google Meet</label>
                
                <input 
                  type="radio" 
                  id="platform-zoom" 
                  name="interview-platform" 
                  className="mr-2" 
                />
                <label htmlFor="platform-zoom" className="mr-4">Zoom</label>
                
                <input 
                  type="radio" 
                  id="platform-ms-teams" 
                  name="interview-platform" 
                  className="mr-2" 
                />
                <label htmlFor="platform-ms-teams">Microsoft Teams</label>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Meeting Link Template</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Automated Reminders</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Candidate Reminder</p>
                  <p className="text-sm text-gray-600">Send reminder to candidates before interview</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Interviewer Reminder</p>
                  <p className="text-sm text-gray-600">Send reminder to interviewers before interview</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reminder Time (Before Interview)</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>1 day</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}