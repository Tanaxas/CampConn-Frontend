import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { getLogs, getLogStats, exportLogs } from '../../services/api';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch logs on mount and when filter/page changes
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page]);
  
  // Fetch logs with current filters
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 50,
        ...formik.values
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      const response = await getLogs(params);
      
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch log statistics
  const fetchStats = async () => {
    try {
      const response = await getLogStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching log stats:', error);
    }
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      const params = { ...formik.values };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      // This will trigger a file download
      window.location.href = `/api/admin/logs/export?${new URLSearchParams(params)}`;
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };
  
  // Filter form
  const formik = useFormik({
    initialValues: {
      startDate: '',
      endDate: '',
      userId: '',
      eventType: '',
      resourceType: '',
      action: '',
      status: ''
    },
    onSubmit: async (values) => {
      setPage(1); // Reset to first page when filter changes
      await fetchLogs();
    }
  });
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failure': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">System Logs</h1>
      
      {/* Log Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium mb-2">Event Types</h3>
            <ul className="space-y-1">
              {stats.eventTypeCounts.map(item => (
                <li key={item.event_type} className="flex justify-between">
                  <span>{item.event_type}</span>
                  <span className="font-medium">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium mb-2">Status Breakdown</h3>
            <ul className="space-y-1">
              {stats.statusCounts.map(item => (
                <li key={item.status} className="flex justify-between">
                  <span className={`px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="font-medium">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium mb-2">Top Users</h3>
            <ul className="space-y-1">
              {stats.topUsers.map(item => (
                <li key={item.user_id} className="flex justify-between">
                  <span className="truncate">{item.user_email || 'System'}</span>
                  <span className="font-medium">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Filter Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-4">
        <h2 className="font-medium mb-4">Filter Logs</h2>
        
        <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={formik.values.startDate}
              onChange={formik.handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={formik.values.endDate}
              onChange={formik.handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User ID
            </label>
            <input
              type="text"
              name="userId"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={formik.values.userId}
              onChange={formik.handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Type
            </label>
            <select
              name="eventType"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={formik.values.eventType}
              onChange={formik.handleChange}
            >
              <option value="">All Event Types</option>
              <option value="auth">Authentication</option>
              <option value="data">Data Manipulation</option>
              <option value="admin">Admin Action</option>
              <option value="system">System Event</option>
              <option value="api">API Request</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resource Type
            </label>
            <select
              name="resourceType"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={formik.values.resourceType}
              onChange={formik.handleChange}
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="listing">Listing</option>
              <option value="message">Message</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={formik.values.status}
              onChange={formik.handleChange}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div className="md:col-span-3 flex justify-between">
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-color text-white rounded hover:bg-opacity-90"
              >
                Apply Filters
              </button>
              
              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  formik.submitForm();
                }}
                className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Reset Filters
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </form>
      </div>
      
      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">No logs found matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.user_email ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{log.user_email}</div>
                          <div className="text-gray-500 dark:text-gray-400">ID: {log.user_id}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {log.event_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {log.details ? (
                        <details>
                          <summary className="cursor-pointer">View Details</summary>
                          <pre className="mt-2 text-xs overflow-auto max-h-40 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </details>
                      ) : log.error_message ? (
                        <span className="text-red-500">{log.error_message}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing page {page} of {totalPages}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;