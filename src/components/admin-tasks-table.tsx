// Create admin tasks table component
import React from "react";

interface Task {
  id: number;
  name: string;
  description: string;
  dueDate: string;
  priority: string;
  assignee: string;
  status: string;
  department: string;
}

interface AdminTasksTableProps {
  tasks: Task[];
}

const AdminTasksTable: React.FC<AdminTasksTableProps> = ({ tasks }) => {
  // Mock data for demonstration
  const mockTasks: Task[] = [
    {
      id: 1,
      name: "Review new candidate applications for Interns",
      description: "Talent Acquisition",
      dueDate: "Sep 20",
      priority: "High",
      assignee: "Jane Doe",
      status: "To Do",
      department: "Talent Acquisition",
    },
    {
      id: 2,
      name: "Schedule interviews for Senior Backend Engineer role",
      description: "Talent Acquisition",
      dueDate: "Sep 22",
      priority: "High",
      assignee: "John Smith",
      status: "In Progress",
      department: "Talent Acquisition",
    },
    {
      id: 3,
      name: "Set up new hire accounts and access for October joiners",
      description: "Employee Onboarding",
      dueDate: "Sep 25",
      priority: "Medium",
      assignee: "Sarah Lee",
      status: "To Do",
      department: "Employee Onboarding",
    },
    {
      id: 4,
      name: "Update employee benefits information in HR portal",
      description: "HR Operations",
      dueDate: "Oct 01",
      priority: "Low",
      assignee: "Mike Chen",
      status: "Completed",
      department: "HR Operations",
    },
    {
      id: 5,
      name: "Prepare quarterly performance review reports for Sales",
      description: "Performance Management",
      dueDate: "Oct 05",
      priority: "Medium",
      assignee: "Jane Doe",
      status: "To Do",
      department: "Performance Management",
    },
    {
      id: 6,
      name: "Draft job descriptions for upcoming Software Engineer positions",
      description: "Recruitment Outreach",
      dueDate: "Oct 08",
      priority: "High",
      assignee: "John Smith",
      status: "To Do",
      department: "Recruitment Outreach",
    },
  ];

  const tasksData = tasks.length > 0 ? tasks : mockTasks;

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task Name
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasksData.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  <div className="flex items-center justify-end">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {task.dueDate}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.priority === "High" ? "bg-red-100 text-red-800" :
                    task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end">
                    <img
                      src={`https://ui-avatars.com/api/?name=${task.assignee}&background=3B82F6&color=FFFFFF`}
                      alt={task.assignee}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-gray-900">{task.assignee}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === "Completed" ? "bg-green-100 text-green-800" :
                    task.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTasksTable;