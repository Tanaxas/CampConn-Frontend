import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import api from '../../services/api';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required')
      .matches(/@hit\.ac\.zw$/, 'Must use a valid HIT email address')
  });
  
  // Initialize form
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        // Call API to send reset email with OTP
        await api.post('/users/forgot-password', { email: values.email });
        
        // Show success state
        setEmailSent(true);
        toast.success('Reset code sent to your email');
      } catch (error) {
        console.error('Forgot password error:', error);
        toast.error(error.response?.data?.message || 'Failed to send reset instructions');
      } finally {
        setLoading(false);
      }
    }
  });
  
  if (emailSent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-bold mt-4">Check Your Email</h2>
          </div>
          
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            We've sent a password reset code to <strong>{formik.values.email}</strong>. Check your inbox and follow the instructions to reset your password.
          </p>
          
          <div className="space-y-4">
            <Link
              to="/reset-password"
              className="w-full block text-center px-5 py-2.5 text-white bg-primary-color hover:bg-opacity-90 rounded-lg focus:outline-none"
            >
              Enter Reset Code
            </Link>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-primary-color hover:underline"
              >
                Try with a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a code to reset your password.
        </p>
        
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@hit.ac.zw"
              className={`w-full px-3 py-2 text-base border ${
                formik.touched.email && formik.errors.email
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              disabled={loading}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-2.5 text-white bg-primary-color hover:bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-color disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Reset Code'
            )}
          </button>
          
          <div className="text-sm mt-4 text-center">
            <Link to="/login" className="text-primary-color hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;