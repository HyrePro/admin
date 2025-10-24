import React from 'react';

export default function SchoolInformationPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold mb-6">School Information</h2>
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">School Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">School Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="School Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">School ID</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="School ID"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="School Address"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Postal Code"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Contact Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Contact Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Phone Number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Contact Email"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}